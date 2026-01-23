import { createSignal, onCleanup } from "solid-js";
import { Box } from "@suid/material";

interface GradientSliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (val: number) => void;
}

export default function GradientSlider(props: GradientSliderProps) {
    let trackRef: HTMLDivElement | undefined;
    const [dragging, setDragging] = createSignal(false);

    // Calculate percent for display
    const percent = () => {
        const p = ((props.value - props.min) / (props.max - props.min)) * 100;
        return Math.min(Math.max(p, 0), 100);
    };

    const handlePointerDown = (e: PointerEvent) => {
        setDragging(true);
        updateValue(e);
        window.addEventListener('pointermove', updateValue);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handlePointerUp = () => {
        setDragging(false);
        window.removeEventListener('pointermove', updateValue);
        window.removeEventListener('pointerup', handlePointerUp);
    };

    const updateValue = (e: PointerEvent) => {
        if (!trackRef) return;
        const rect = trackRef.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let p = x / rect.width;
        p = Math.min(Math.max(p, 0), 1);

        let range = props.max - props.min;
        let newVal = (p * range) + props.min;

        if (props.step) {
            newVal = Math.round(newVal / props.step) * props.step;
        }

        // Handle floating point precision issues
        if (props.step && props.step < 1) {
            newVal = parseFloat(newVal.toFixed(1));
        } else {
            newVal = Math.round(newVal);
        }

        // Clamp just in case
        newVal = Math.min(Math.max(newVal, props.min), props.max);

        props.onChange(newVal);
    };

    return (
        <Box
            ref={trackRef}
            onPointerDown={handlePointerDown}
            sx={{
                position: 'relative',
                width: '100%',
                height: 24, // Touch target height
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                touchAction: 'none',
                userSelect: 'none'
            }}
        >
            {/* Background Track */}
            <Box sx={{
                width: '100%',
                height: 6,
                borderRadius: 99,
                background: 'rgba(255,255,255,0.1)',
                position: 'relative',
            }}>
                {/* Fill Gradient */}
                <Box sx={{
                    width: `${percent()}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #F472B6, #C084FC, #2DD4BF)',
                    borderRadius: 99,
                    transition: dragging() ? 'none' : 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 10px rgba(192, 132, 252, 0.4)'
                }} />
            </Box>

            {/* Thumb */}
            <Box sx={{
                position: 'absolute',
                left: `${percent()}%`,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                transform: 'translate(-50%, 0)',
                boxShadow: '0 0 15px rgba(255,255,255,0.6)',
                transition: dragging() ? 'none' : 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
                '&:hover': {
                    transform: 'translate(-50%, 0) scale(1.2)'
                }
            }} />
        </Box>
    );
}
