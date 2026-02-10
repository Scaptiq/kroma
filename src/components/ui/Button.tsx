import { splitProps } from "solid-js";
import { cx } from "./utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";

type ButtonProps = {
    variant?: ButtonVariant;
    tone?: "dark" | "light";
    class?: string;
} & JSX.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button(props: ButtonProps) {
    const [local, rest] = splitProps(props, ["variant", "tone", "class"]);
    const variant = local.variant ?? "default";
    const tone = local.tone ?? "dark";

    const base =
        "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none" +
        (tone === "light" ? " focus-visible:ring-offset-white" : " focus-visible:ring-offset-black");

    const variantsByTone: Record<"dark" | "light", Record<ButtonVariant, string>> = {
        dark: {
            default:
                "bg-white text-black hover:bg-slate-100",
            secondary:
                "bg-slate-900 text-slate-100 hover:bg-slate-800 border border-slate-800",
            outline:
                "border border-slate-700 text-slate-100 hover:bg-slate-900",
            ghost:
                "text-slate-200 hover:bg-slate-900",
        },
        light: {
            default:
                "bg-slate-900 text-white hover:bg-slate-800",
            secondary:
                "bg-white text-slate-900 hover:bg-slate-50 border border-slate-200",
            outline:
                "border border-slate-300 text-slate-700 hover:bg-slate-100",
            ghost:
                "text-slate-600 hover:bg-slate-100",
        },
    };

    return (
        <button class={cx(base, variantsByTone[tone][variant], local.class)} {...rest} />
    );
}
