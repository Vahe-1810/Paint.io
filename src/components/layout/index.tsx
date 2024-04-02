import "./styles.css";

function Layout({ ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="layout">
      {props.children}
    </div>
  );
}

export default Layout;
