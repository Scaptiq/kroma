import { splitProps } from "solid-js";
import { cx } from "./utils";

type LabelProps = {
    class?: string;
} & JSX.LabelHTMLAttributes<HTMLLabelElement>;

export function Label(props: LabelProps) {
    const [local, rest] = splitProps(props, ["class"]);
    return (
        <label class={cx("text-sm font-medium text-slate-200", local.class)} {...rest} />
    );
}
