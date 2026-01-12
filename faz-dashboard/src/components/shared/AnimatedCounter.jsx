import { useSpring, animated } from "@react-spring/web";
import React from "react";

export default function AnimatedCounter({ value = 0, duration = 800 }) {
    const { number } = useSpring({
        from: { number: 0 },
        number: value,
        config: { duration },
    });

    return (
        <animated.span>
            {number.to((n) => Math.floor(n).toLocaleString())}
        </animated.span>
    );
}
