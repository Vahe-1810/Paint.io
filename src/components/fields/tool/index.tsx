import { memo } from "react";
import "./styles.css";

type ToolButtonProps = React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  sz?: "sm" | "md" | "lg" | number;
  bgcolor: string;
};

const SIZE = {
  sm: 32,
  md: 48,
  lg: 64,
};

const ToolButton = memo(({ sz, bgcolor, ...props }: ToolButtonProps) => {
  const isSizeNumber = typeof sz === "number";

  return (
    <input
      {...props}
      style={{
        width: isSizeNumber ? sz : SIZE[(sz as keyof typeof SIZE) || "sm"],
        height: isSizeNumber ? sz : SIZE[(sz as keyof typeof SIZE) || "sm"],
        background: bgcolor,
        borderRadius: isSizeNumber ? "50%" : "none",
        boxShadow: isSizeNumber ? "none" : "revert-layer",
        ...props.style,
      }}
      className="tool-button"
    />
  );
});

export default ToolButton;
