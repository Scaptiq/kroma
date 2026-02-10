import { splitProps } from "solid-js";
import { cx } from "./utils";

type InputProps = {
    tone?: "dark" | "light";
    class?: string;
} & JSX.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
    const [local, rest] = splitProps(props, ["tone", "class"]);
    const tone = local.tone ?? "dark";
    return (
        <input
            class={cx(
                tone === "light"
                    ? "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    : "w-full rounded-md border border-slate-800 bg-black/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400",
                local.class
            )}
            {...rest}
        />
    );
}
