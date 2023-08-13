import { ReactNode } from "react";

function SVGIconWrapper({ 
    styles={}, 
    width=0, 
    height=0, 
    viewBox,
    className = "", 
    children 
}: {
    styles: any,
    width: number,
    height: number,
    viewBox?: string,
    className: string,
    children: ReactNode
}) {
    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox?viewBox:`0 0 ${width} ${height}`}
            fill="inherit"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            style={styles}
        >
            {children}
        </svg>
    );
}

export default SVGIconWrapper;
