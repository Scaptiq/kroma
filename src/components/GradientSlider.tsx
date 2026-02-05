import { createSignal } from "solid-js";

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

        if (props.step && props.step < 1) {
            newVal = parseFloat(newVal.toFixed(1));
        } else {
            newVal = Math.round(newVal);
        }

        newVal = Math.min(Math.max(newVal, props.min), props.max);
        props.onChange(newVal);
    };

    return (
        <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            class="relative flex h-6 w-full cursor-pointer select-none items-center"
            style={{ "touch-action": "none" }}
        >
            <div class="h-1.5 w-full rounded-full bg-slate-800">
                <div
                    class="h-full rounded-full bg-gradient-to-r from-sky-400 via-slate-200 to-slate-50"
                    style={{ width: `${percent()}%`, transition: dragging() ? 'none' : 'width 0.2s ease' }}
                />
            </div>
            <div
                class="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow"
                style={{ left: `${percent()}%`, transform: 'translate(-50%, -50%)', transition: dragging() ? 'none' : 'left 0.2s ease' }}
            />
        </div>
    );
}
