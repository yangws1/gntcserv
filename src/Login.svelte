<script>
    import {name, order, sanctuary} from './stores.js'
    export let secretcode;
</script>
<div>
    <div class="u"><span class="t">성전:&nbsp</span><br/></div>
    <input class="" bind:value={$name}/><br/><br/>
    <div class="u"><span class="t">기수:&nbsp</span><br/></div>
    <input class="" bind:value={$order}/><br/><br/>
    <div class="u"><span class="t">이름:&nbsp</span><br/></div>
    <input class="" bind:value={$sanctuary}/><br/><br/>
    <div class="u"><span class="t">회장단 코드:</span><br/></div>
    <input class="" bind:value={secretcode}/><br/><br/>
</div>

<style>

    .u
    {
        text-align: left;
    }
    .t
    {

        position: relative;
        left: calc(50% - 20%);
        font-size: 0.95em;
        font-weight: lighter;
    }
    input
    {
        width: 40%;
        min-width: 100px;
    }
</style>