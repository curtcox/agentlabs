<script lang="ts">
	import LoadingFrame from "$lib/components/common/loading-frame/LoadingFrame.svelte";
	import { forgetUser } from "$lib/stores/auth";
	import AuthOnly from "$lib/gates/AuthOnly.svelte";

	forgetUser();
</script>

<AuthOnly>
	<LoadingFrame />
</AuthOnly>
