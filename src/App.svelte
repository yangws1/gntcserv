<script>
    import { fade } from 'svelte/transition'
    import { clearJigsaw, varypuzzlecount, clearCMind, name, sanctuary, order } from './stores.js'
    import Timer from "./Timer.svelte"
    import Jigsaw from "./Jigsaw.svelte"
    import Login from "./Login.svelte"
    import Catchmind from "./Catchmind.svelte"
    import Varypuzzle from "./Varypuzzle.svelte"

    const hash = function(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
    };

    let code4, comment;
    let firstPage = true;
    let secretcode;
    let page = 1;
    let jmp = false;
    let nextAble = [null, false, false, false, false, false, false];
    const timer = 
    {
        timerId: null,
        timeLeft: 0,
        timerEnd: false,
    }
    
    async function timerLoad(second)
    {
        timer.timerEnd = false;
        timer.timerId = setInterval(() => {timer.timeLeft--} , 1000)
        setTimeout(()=>{timer.timerEnd = true ; clearInterval(timer.timerId)} , second * 1000)
        timer.timeLeft = second;
    }
   
    function clickStart()
    {
        firstPage = false;
    }
    $: if ($name != "" && $order !="" && $sanctuary != "")
    {
        nextAble[1] = true;
    }
    $: if (nextAble[3] && timer.timerEnd == true && secretcode == "베드로153")
    {
        nextAble[4] = true;
    }
    $: if (page == 3 && code4 == "먼저-그-나라와-그-의를-구하라") {jmp = true;}
    $: if (page == 5 && comment != "") {nextAble[6] = true;}
    function nextPage()
    {   
        if (jmp)
        {
            page = 5;
            return;
        }
        if(page == 1)
        {
            timerLoad(630)
            setTimeout(() => {nextAble[2] = true} , 600)
        }
        if (page == 2)
        {
            timerLoad(1530)
            setTimeout(() => { nextAble[3] = true}, 1500)
        }
        if (page == 3)
        {
            timerLoad(630);
        }
        page++;
    }
    function sendDatas()
    {
        var db = new PouchDB("http://admin:19450815@localhost:5984");
        db.put(
            {
                _id: hash($name+$sanctuary+$order),
                name: $name,
                order: $order,
                sanct: $sanctuary,
                time: new Date(),
                cnt1: $varypuzzlecount,
                cnt2: $clearJigsaw,
                cnt3: $clearCMind
            }
        )
    }
</script>

<svelte:head>
    <title>2021 겨울수련회 성전별 모임</title>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300&display=swap" rel="stylesheet">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pouchdb@7.2.1/dist/pouchdb.min.js"></script>
</svelte:head>
{#if firstPage}
<div transition:fade="{{duration: 1000}}"
    style="height: 100%; width: 100%; background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.1)); opacity:100%; background-size: cover;
    position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: flex; justify-content: center; align-items: center; z-index: 5;" id="canvas1">
    <div style="text-align: center;">
        <h1 style="color:pink;">할렐루야! 성전별 모임에 오신 것을 환영합니다!</h1>
        <button class="pretty" on:click="{clickStart}" style="font-size: 1.25em;"><b>시작하기</b></button>
    </div>
</div>
{/if}

<div id="cheat" style="display: none;">
    <div style="position:fixed; left: 15%; top 15%">
        pagetester
        <button on:click={()=>page = 1}>1</button>
        <button on:click={()=>page = 2}>2</button>
        <button on:click={()=>page = 3}>3</button>
        <button on:click={()=>page = 4}>4</button>
        <button on:click={()=>page = 5}>5</button>
        <button on:click={()=>{timer.timerLeft = 0; timer.timerEnd = true;}}>타이머종료</button>
        <button on:click={()=>{timer.timerEnd = false}}>타이머초기화</button>
    </div>
</div>
<div class="float-timer">
    <Timer bind:second={timer.timeLeft} />
</div>
<div class="before" class:sticky={!firstPage}>
    <div class="nav-item">_</div>
    <div class="nav-item">성전별 모임</div>
    <div class="nav-item">_</div>
</div>

<div id="main" class="bgr" style="background-size: cover; background-image: url(./data/img/frt2.jpg);">
    <div class="card">
        <!-- 로그인 섹션 -->
        {#if page == 1}
            <Login bind:secretcode/>
        {/if}
        <!-- 직소퍼즐 -->
        {#if page == 2}
            <Jigsaw bind:timeout={timer.timerEnd}/>
        {/if}

        {#if page == 3}
           <Catchmind bind:timeout={timer.timerEnd} bind:codeManager={secretcode}/>
        {/if}

        {#if page == 4}
            <Varypuzzle bind:timeout={timer.timerEnd}/>
        {/if}

        {#if page == 5}
            <div>
                같은 성전 청년들에게 칭찬과 응원의 한 마디 남겨 주세요!
                <input bind:value={comment}/> <button on:click={sendDatas}>제출하기</button>
            </div>
        {/if}
        {#if page == 6}
        <div>
            성전별 모임 프로그램이 마무리 되었습니다!<br/>
        </div>
        {/if}
        <div>
            {#if page == 3}
                <br/><hr class="hair-line"/>
                마지막 단계는 2, 3단계 진행 후 (Zoom 소모임으로 진행됩니다.) 통과 코드가 주어집니다! 코드를 입력하세요!
                <input bind:value={code4}/>
            {/if}
            <div style="position: relative; text-align: right; right: 8.5%;">
                <button class="pretty" disabled={!nextAble[page]} id="next" on:click={nextPage}>다음 &raquo;</button>
            </div>            
        </div>
    </div>
</div>
<style>

    .before
    {
        margin: 0px;
        width:100%;
        height:80px;
        left: 0; top: 0;
        background:black;
        display:flex;
        justify-content:space-between;
        align-items: center;
        flex-direction:row;
    }
    .sticky
    {
        position:fixed;
    }

    .card
    {
        margin-top: 5em;
        margin-bottom: 3em;
        width: 75%;
        min-height: 65%;
        height: max-content;
        border: none;
        border-radius: 12px;
        opacity: 100%;
        background-color: white;
        box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
        padding: 1em;
        padding-top: 1.5em;
        display:flex; 
        justify-content: center;
        text-align: center;
        flex-direction: column;
        margin: 0 auto;
    }

    .bgr
    {
        z-index: 1; 
        width: 100%; 
        opacity:100%;
        position: fixed; 
        left: 0; right: 0; top: 80px; bottom: 0; 
        padding-top: 8%;
        overflow-y: scroll;
    }

    .float-timer
    {
        padding: 6px;
        font-size: 1.25em;
        z-index: 3;
        position: absolute;
        top: 95px; right: 5%;
        margin-right: 10px;
        border: none;
        border-radius: 0px;
        background-color: rgba(0, 0, 0, 0.850);
        color: white;
        font-family: "Noto Serif KR", "Serif";
    }

    .nav-item
    {
        color: white;
        font-size: 1.5em;
        font-family: "Noto Sans KR", "Sans-Serif";
        padding: 25px;
    }

    .pretty
    {
        color: white;
        border-radius: 3px;
        border: none;
        background-color: cornflowerblue;
        margin: 3px;
        padding: 0.6em;
        transition: 0.55s;
    }
    .pretty:focus{
        border: none;
        outline: none;
    }
    .pretty:hover{
        background-color: pink;
    }
    .pretty:disabled
    {
        background-color: grey;
    }

</style>