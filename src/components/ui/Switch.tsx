import { splitProps } from "solid-js";
import { cx } from "./utils";

type SwitchProps = {
    checked: boolean;
    onChange: (value: boolean) => void;
    class?: string;
    disabled?: boolean;
};

export function Switch(props: SwitchProps) {
    const [local] = splitProps(props, ["checked", "onChange", "class", "disabled"]);
    return (
        <button
            type="button"
            class={cx(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
                local.checked ? "bg-sky-400 border-sky-400" : "bg-slate-900 border-slate-800",
                local.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                local.class
            )}
            onClick={() => !local.disabled && local.onChange(!local.checked)}
            aria-pressed={local.checked}
        >
            <span
                class={cx(
                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    local.checked ? "translate-x-4" : "translate-x-1"
                )}
            />
        </button>
    );
}
