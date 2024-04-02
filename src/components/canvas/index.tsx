import { useRef, useEffect, useState } from "react";
import Bucket from "@/assets/bucket.svg?react";
import Pencil from "@/assets/pencil.svg?react";
import pencilUrl from "@/assets/pencil.svg?url";
import bucketUrl from "@/assets/bucket.svg?url";
import { IDrawingTools } from "@/types/types";
import { COLORS, DRAW_SIZES } from "@/mocks";
import { LINEAR_GRADIENT_MULTICOLOR } from "@/constants";
import { rgbToHex } from "@/helpers/rgbToHex";
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

  useEffect(() => {
    // initialization
    const canvas = canvasRef.current;
    const ctx = (ctxRef.current = canvas!.getContext("2d", { willReadFrequently: true })!);

    ctx.fillStyle = "#cbcbcb";
    ctx.fillRect(0, 0, canvas!.width, canvas!.height);

    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current!;

    let prevX: number;
    let prevY: number;

    let isMouseLeaved = false;
    let isPressed = false;

    const handleStartDraw = (e: MouseEvent) => {
      isPressed = true;
      prevX = e.offsetX;
      prevY = e.offsetY;

      ctx.lineWidth = currentLineWidth;
      ctx.strokeStyle = currentColor;

      tool === "pencil" && draw(e.offsetX, e.offsetY, e.offsetX, e.offsetY);
    };

    const handleDraw = (e: MouseEvent) => {
      if (isPressed && !isMouseLeaved && tool !== "bucket") {
        draw(prevX, prevY, e.offsetX, e.offsetY);
        prevX = e.offsetX;
        prevY = e.offsetY;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      isPressed = false;
      if (e.target === canvas && tool === "pencil") handleSaveState();
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
          ctx.clearRect(0, 0, canvas!.width, canvas!.height);
          redoStack.push(undoStack.pop()!);
          const stateSrc = undoStack.at(-1);

          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = stateSrc as string;
          return;
        }

        if (code === "KeyY" && redoStack.length > 0) {
          ctxRef.current!.clearRect(0, 0, canvas!.width, canvas!.height);
          const redoEl = redoStack.pop() as string;
          undoStack.push(redoEl);

          const img = new Image();

          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = redoEl;
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
    window.addEventListener("mouseup", handleMouseUp);
    canvas?.addEventListener("mousemove", handleDraw);
    canvas?.addEventListener("mouseleave", handleMouseLeave);
    canvas?.addEventListener("mouseover", handleMouseOver);
    canvas?.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleUndoRedo);

    return () => {
      canvas?.removeEventListener("mousedown", handleStartDraw);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas?.removeEventListener("mousemove", handleDraw);
      canvas?.removeEventListener("mouseleave", handleMouseLeave);
      canvas?.removeEventListener("mouseover", handleMouseOver);
      canvas?.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleUndoRedo);
    };
  }, [currentColor, currentLineWidth, tool]);

  const handleSaveState = () => {
    undoStack.push(canvasRef.current!.toDataURL());
    redoStack.length = 0;
  };

  const fillArea = (x: number, y: number, oldColor: string) => {
    const stack = [{ x, y }];
    const visited = new Set();
    const edges: { x: number; y: number; color: string }[] = [];
    const fillSize = 2;

    while (stack.length > 0) {
      const { x, y } = stack.pop()!;

      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const [r, g, b] = ctxRef.current!.getImageData(x, y, fillSize, fillSize).data;
      const hex = rgbToHex(r, g, b);

      if (hex !== oldColor) {
        edges.push({ x, y, color: currentColor });
        continue;
      }

      ctxRef.current!.fillRect(x, y, fillSize, fillSize);

      stack.push({ x: x + fillSize, y: y + fillSize });
      stack.push({ x: x, y: y + fillSize });
      stack.push({ x: x - fillSize, y: y + fillSize });
      stack.push({ x: x - fillSize, y: y });
      stack.push({ x: x - fillSize, y: y - fillSize });
      stack.push({ x: x, y: y - fillSize });
      stack.push({ x: x + fillSize, y: y - fillSize });
      stack.push({ x: x + fillSize, y: y });
    }

    ctxRef.current!.moveTo(edges[0].x, edges[0].y);
    edges.forEach(({ x, y, color }) => {
      ctxRef.current!.beginPath();
      ctxRef.current!.lineWidth = 6;
      ctxRef.current!.strokeStyle = color;
      ctxRef.current!.lineTo(x, y);
      ctxRef.current!.stroke();
      ctxRef.current!.closePath();
    });
  };

  const draw = (px: number, py: number, cx: number, cy: number) => {
    const ctx = ctxRef.current!;

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  };

  const handleChangeColor = (color: string) => {
    setCurrentColor(color);
  };

  const handleChangeLineWidth = (width: number) => {
    setCurrentLineWidth(width);
  };

  return (
    <div className="root">
      <div className="drawing-tools">
        <div className="drawing-box-main">
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
