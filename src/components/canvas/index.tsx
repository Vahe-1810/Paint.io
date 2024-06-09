import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import Bucket from "@/assets/bucket.svg?react";
import bucketUrl from "@/assets/bucket.svg?url";
import Clear from "@/assets/clear.svg?react";
import Pencil from "@/assets/pencil.svg?react";
import pencilUrl from "@/assets/pencil.svg?url";
import { LINEAR_GRADIENT_MULTICOLOR } from "@/constants";
import { rgbToHex } from "@/helpers/rgbToHex";
import { COLORS, DRAW_SIZES } from "@/mocks";
import { socket } from "@/socket";
import { IDrawingTools } from "@/types/types";

import ToolField from "../fields/tool";
import "./styles.css";

const Canvas = (props: React.HTMLAttributes<HTMLCanvasElement>) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>();

  const [currentColor, setCurrentColor] = useState("#000");
  const [currentLineWidth, setCurrentLineWidth] = useState(10);

  const [tool, setTool] = useState<IDrawingTools>("pencil");

  const undoStack = useRef<string[]>([]).current;
  const redoStack = useRef<string[]>([]).current;

  const { pathname } = useLocation();

  useEffect(() => {
    // initialization

    // canvas
    const canvas = canvasRef.current;
    const ctx = (ctxRef.current = canvas!.getContext("2d", { willReadFrequently: true })!);

    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // socket io

    if (!socket.connected) {
      socket.connect();
      socket.emit("join", pathname.split("/").at(-1));
    }

    socket.on("connect", () => {});

    socket.on("joined", (_, url) => {
      drawCanvasImage(url);
    });

    socket.on("draw-pencil", ({ px, py, cx, cy, color, width }) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      draw(px, py, cx, cy);
    });

    socket.on("draw-state", (url) => {
      drawCanvasImage(url);
    });

    socket.on("clear", () => {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      undoStack.length = 0;
      redoStack.length = 0;
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current!;

    let prevX: number;
    let prevY: number;

    let isMouseLeaved = false;
    let isPressed = false;

    const handleStartDraw = (e: MouseEvent) => {
      if (e.button === 0) {
        isPressed = true;
        prevX = e.offsetX;
        prevY = e.offsetY;

        ctx.lineWidth = currentLineWidth;
        ctx.strokeStyle = currentColor;

        tool === "pencil" && draw(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
      }
    };

    const handleDraw = (e: MouseEvent) => {
      if (isPressed && !isMouseLeaved && tool !== "bucket") {
        draw(prevX, prevY, e.offsetX, e.offsetY);
        socket.emit("draw-pencil", {
          px: prevX,
          py: prevY,
          cx: e.offsetX,
          cy: e.offsetY,
          color: currentColor,
          width: currentLineWidth,
        });
        prevX = e.offsetX;
        prevY = e.offsetY;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isPressed = false;
      if (e.target === canvas && tool === "pencil") {
        handleSaveState();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      isMouseLeaved = true;
      ctx.closePath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };

    const handleMouseOver = () => {
      isMouseLeaved = false;
    };

    const handleUndoRedo = ({ code, ctrlKey }: KeyboardEvent) => {
      if (ctrlKey) {
        if (code === "KeyZ" && undoStack.length > 0) {
          redoStack.push(undoStack.pop()!);
          const stateSrc = undoStack.at(-1)!;

          drawCanvasImage(stateSrc);
          socket.emit("draw-state", undoStack.at(-1));
          return;
        }

        if (code === "KeyY" && redoStack.length > 0) {
          const redoEl = redoStack.pop() as string;
          undoStack.push(redoEl);

          drawCanvasImage(redoEl);
          socket.emit("draw-state", undoStack.at(-1));
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      const ctx = ctxRef.current!;
      switch (tool) {
        case "bucket": {
          ctx.fillStyle = currentColor;
          const { data } = ctx.getImageData(e.offsetX, e.offsetY, 3, 3);
          const hex = rgbToHex(data[0], data[1], data[2]);
          fillArea(e.offsetX, e.offsetY, hex);
          ctx.fill();
          handleSaveState();
          break;
        }
      }
    };

    canvas?.addEventListener("mousedown", handleStartDraw);
    canvas?.addEventListener("mousemove", handleDraw);
    canvas?.addEventListener("mouseleave", handleMouseLeave);
    canvas?.addEventListener("mouseover", handleMouseOver);
    canvas?.addEventListener("click", handleClick);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleUndoRedo);

    return () => {
      canvas?.removeEventListener("mousedown", handleStartDraw);
      canvas?.removeEventListener("mousemove", handleDraw);
      canvas?.removeEventListener("mouseleave", handleMouseLeave);
      canvas?.removeEventListener("mouseover", handleMouseOver);
      canvas?.removeEventListener("click", handleClick);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleUndoRedo);
    };
  }, [currentColor, currentLineWidth, tool]);

  const handleSaveState = () => {
    const savingUrl = canvasRef.current!.toDataURL();
    undoStack.push(savingUrl);
    redoStack.length = 0;
    socket.emit("draw-state", undoStack.at(-1));
  };

  const fillArea = (x: number, y: number, oldColor: string) => {
    const ctx = ctxRef.current!;
    const stack = [{ x, y }];
    const visited = new Set();
    const edges: { x: number; y: number }[] = [];
    const fillSize = 2;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      const key = `${x},${y}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const [r, g, b] = ctx.getImageData(x, y, fillSize, fillSize).data;
      const hex = rgbToHex(r, g, b);

      if (hex !== oldColor) {
        edges.push({ x, y });
        continue;
      }

      ctx.fillRect(x, y, fillSize, fillSize);

      stack.push({ x: x + fillSize, y: y + fillSize });
      stack.push({ x: x, y: y + fillSize });
      stack.push({ x: x - fillSize, y: y + fillSize });
      stack.push({ x: x - fillSize, y: y });
      stack.push({ x: x - fillSize, y: y - fillSize });
      stack.push({ x: x, y: y - fillSize });
      stack.push({ x: x + fillSize, y: y - fillSize });
      stack.push({ x: x + fillSize, y: y });
    }

    ctx.moveTo(edges[0].x, edges[0].y);
    edges.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.lineTo(x, y);
      ctx.stroke();
    });
  };

  const draw = (px: number, py: number, cx: number, cy: number) => {
    const ctx = ctxRef.current!;

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  };

  const drawCanvasImage = (url: string) => {
    if (canvasRef.current) {
      ctxRef.current!.clearRect(0, 0, canvasRef.current?.width, canvasRef.current!.height);
      const img = new Image();

      img.onload = () => {
        ctxRef.current!.drawImage(img, 0, 0);
      };
      img.src = url;
    }
  };

  const handleChangeColor = (color: string) => {
    setCurrentColor(color);
  };

  const handleChangeLineWidth = (width: number) => {
    setCurrentLineWidth(width);
  };

  const handleClear = () => {
    redoStack.length = 0;
    undoStack.length = 0;
    socket.emit("clear", "");
  };

  return (
    <div className="root">
      <div className="drawing-tools">
        <div className="drawing-box-main">
          <Clear onClick={handleClear} cursor="pointer" />
          <Bucket
            cursor="pointer"
            onClick={() => {
              setTool("bucket");
              canvasRef!.current!.style.cursor = `url(${bucketUrl}) 6 24, pointer`;
            }}
          />
          <Pencil
            cursor="pointer"
            onClick={() => {
              setTool("pencil");
              canvasRef!.current!.style.cursor = `url(${pencilUrl}) 6 24, pointer`;
            }}
          />
        </div>
        <div className="drawing-box-main">
          {COLORS.map((color) => (
            <ToolField key={color} type="button" bgcolor={color} onClick={() => handleChangeColor(color)} />
          ))}
          <ToolField
            type="color"
            bgcolor={LINEAR_GRADIENT_MULTICOLOR}
            onChange={(e) => handleChangeColor(e.target.value)}
          />
          <ToolField bgcolor={currentColor} disabled />
        </div>

        <div className="drawing-size">
          {DRAW_SIZES.map((size) => (
            <ToolField
              key={size}
              bgcolor={currentLineWidth === size ? currentColor : "inherit"}
              type="button"
              sz={size + 5}
              onClick={() => handleChangeLineWidth(size)}
            />
          ))}
        </div>
      </div>

      <canvas className="canvas" width={1048} height={600} ref={canvasRef} {...props} />
    </div>
  );
};

export default Canvas;
