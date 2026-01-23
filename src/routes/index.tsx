import { onMount } from "solid-js";
import { useNavigate } from "solid-start";

export default function Home() {
    const navigate = useNavigate();
    onMount(() => {
        navigate("/v3/", { replace: true });
    });
    return null;
}
