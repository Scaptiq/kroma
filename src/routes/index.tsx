import { onMount } from "solid-js";
import { useNavigate } from "solid-start";

export default function Home() {
    const navigate = useNavigate();
    onMount(() => {
        navigate("/setup", { replace: true });
    });
    return null;
}
