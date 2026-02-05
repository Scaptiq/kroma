import { splitProps } from "solid-js";
import { cx } from "./utils";

type CardProps = {
    class?: string;
} & JSX.HTMLAttributes<HTMLDivElement>;

export function Card(props: CardProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <div
            class={cx(
                "rounded-xl border border-slate-800 bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(0,0,0,0.35)]",
                local.class
            )}
            {...rest}
        />
    );
}

export function CardHeader(props: CardProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <div class={cx("border-b border-slate-900 p-4", local.class)} {...rest} />
    );
}

export function CardTitle(props: CardProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <h3 class={cx("text-base font-semibold text-slate-100", local.class)} {...rest} />
    );
}

export function CardDescription(props: CardProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <p class={cx("text-sm text-slate-400", local.class)} {...rest} />
    );
}

export function CardContent(props: CardProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <div class={cx("p-4", local.class)} {...rest} />
    );
}
