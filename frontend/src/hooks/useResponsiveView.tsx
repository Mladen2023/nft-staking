import { useEffect, useState } from "react";

export const useResponsiveView = (size = 800) => {
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= size);

    const handleResize = () => {
        setIsMobileView(window.innerWidth <= size);
    };

    useEffect(() => {
        window.addEventListener("resize", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return isMobileView;
};
