<script>

    //게임 클리어 인덱스
    import { clearJigsaw } from './stores.js';
    //시간초과변수 바인딩
    export let timeout = true;
    let data;
    let endDescription = "";
    let gameId;
    let tabId;
    let solved = [];
    let onplay = false;
    $: getTabId = () => `tabId${tabId}`;
    //로딩
    /*
    ===game-Object=== 
    {
        gameName, //게임명
        gameDesc, //게임설명
        content  //게임설정
        ex)
        [
            null,
            {
                descEnd: 게임 후 설명; [필요시] /text

                ---오디오 퍼즐인 경우---
                audio: ["audio/path/1.mp3", ...];

                ---영상 퍼즐인 경우---
                video: {path: "path/to/video.mp4", codec: "코덱"}

                ---직소퍼즐일 경우--
                image: "path/to/img.jpg"

                ---직소퍼즐을 제외하고---
                answer: "text"

                ---악보보고 찬송가 맞추기 퍼즐---
                images: ["path/to/img1", ...]
            }
        ]
        // 추가 tabs = [] / tabId[:id] = []
    };
    */
    async function getData()
    {
        // 게임 데이터 불러오기
        const res = await fetch("./data/jigsaw.json");
        data = await res.json();

        if (res.ok)
        {   
            tabGenerator();
            return data;
        }
        else throw new Error(data);
    }
    function tabGenerator()
    {
        data.tabCount = 0;
        data.tabs = [null, ];
        for(var i = 1; i < data.content.length; i++)
        {
            if (i % 10 == 1) 
            {   
                data.tabCount++;
                data.tabs[data.tabCount] = `${i}-${i + 9}번 문제`
                data[`tabId${data.tabCount}`] = [];
            }
            data[`tabId${data.tabCount}`].push(`문제 ${i}번`);
        }
        tabId = 1;
    }
    function loadGame()
    {
        onplay = true;
        endDescription = "";
        const element = document.querySelector("#game-puzzle");
        element.pz = new Puzzle({
            el          : element,
            image       : data.content[gameId].image,
            difficulty  : "expert",
            numrows     : 5,
            numcolumns  : 5,
            finished    : function(evt){endGame(evt)}
        }).init();
    }
    function endGame(evt)
    {   

        setTimeout(function() {
            onplay = false;
            Object.assign(evt.self.fullImg.style,{'opacity':1,'z-index':1});
        }.bind(evt),300);
        $clearJigsaw = [...$clearJigsaw,  gameId];
        endDescription = data.content[gameId].descEnd;
        solved[gameId] = true;
    }
    let gameContent = getData();

    //탭 생성

</script>

<svelte:head>
    <script src="https://cdn.polyfill.io/v2/polyfill.min.js?features=default"></script>
    <script src="./data/puzzle.js"></script>
    <link rel="stylesheet" href="./data/puzzle.css">
</svelte:head>

{#await gameContent}
<div>
    <p>로딩중... 잠시만 기다려 주세요!</p>
</div>

{:then data}
<div>
    <h3>{data.gameName}</h3>
    <hr class="hair-line"/>
    <p>
        {data.gameDesc}
    </p>
    <div class="tabs">
        {#each data.tabs as tab, i}
            {#if i > 0}
            <button class="pretty-grey" on:click='{() => tabId = i}'>
                {tab}
            </button>
            {/if}
        {/each}
    </div>
    <div class="tab-items">
        {#each data[getTabId()] as item, i}
            <button  class="pretty" disabled={timeout | solved[i + 1]} on:click='{() => {gameId = i + 1; loadGame()}}'>
                {item}
            </button>
        {/each}
    </div>
    <div>
        <hr class="hair-line"/><br/>
        
        <div>
            {endDescription}
        </div>
    </div>

</div>

{:catch error}
<div>
    <p>
        Error occured - {error}
    </p>
</div>
{/await}

<div id="game-puzzle" class="pop"></div>

<style>
    .pop{
        display: block;
        margin: 10px;
        z-index: 1;
    }
    .tabs
    {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        border-radius: 5px;
        background-color: lightgray;
    }
    .tab-items
    {
        display: flex;
        flex-direction: row;
        border-radius: 5px;
        background-color:darkgray;
    }

    .pretty-grey
    {
        border-radius: 3px;
        border: none;
        margin: 3px;
        padding: 0.6em;
        transition: 0.55s;
        color: white;
        background-color:steelblue;
    }
    .pretty-grey:disabled{
        background-color: lightslategrey;
    }

    .pretty-grey:focus{
        border: none;
        outline: none;
    }
    .pretty-grey:hover{
        background-color: lightsteelblue;
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