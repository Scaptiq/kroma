import { splitProps } from "solid-js";
import { cx } from "./utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";

type ButtonProps = {
    variant?: ButtonVariant;
    class?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: ButtonProps) {
    const [local, rest] = splitProps(props, ["variant", "class"]);
    const variant = local.variant ?? "default";

    const base =
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-50 disabled:pointer-events-none";

    const variants: Record<ButtonVariant, string> = {
        default:
            "bg-white text-black hover:bg-slate-100",
        secondary:
            "bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800",
        outline:
            "border border-slate-700 text-slate-100 hover:bg-slate-900",
        ghost:
            "text-slate-200 hover:bg-slate-900",
    };

    return (
        <button class={cx(base, variants[variant], local.class)} {...rest} />
    );
}
