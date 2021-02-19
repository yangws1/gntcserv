<script>
    import {clearCMind} from "./stores.js"
    export let timeout;
    export let codeManager;
    let code;
    let quiz = "";
    let end = false;
    let showData = "";
    let o = 
    {
        a1536a: "송아지",
        b8387b: "감언이설",
        c2317c: "보면대",
        d7616d: "모세",
        e4548e: "햄스터",
        f4632f: "오매불망",
        g1896g: "성미",
        h1386h: "요나",
        i6054i: "도롱뇽",
        j3576j: "고군분투",
        a9035a: "청년봉사선교회",
        b2088b: "삭개오",
        c4312c: "아나콘다",
        d2662d: "거두절미",
        e6375e: "성가대",
        f9387f: "솔로몬",
        g1038g: "흰수염고래",
        h2688h: "결초보은",
        i5653i: "대표기도",
        j5312j: "스가랴",
        j7012j: "재규어",
        a6863a: "대서특필",
        b4386b: "주중예배",
        c1245c: "골리앗",
        d6563d: "두루미",
        e1382e: "삼삼오오",
        f3486f: "만나실",
        g1257g: "다니엘",
        h4052h: "황제펭귄",
        i1238i: "경거망동",
        j8702j: "교회학교",
        a5073a: "마리아",
        b2027b: "뻐꾸기",
        c9654c: "개과천선",
        d2425d: "목사님",
        e8612e: "노아",
        f1219f: "북극곰",
        g7870g: "격세지감",
        h1386h: "헌금",
        i8432i: "지금부터 자유주제!"
    }
    function showNext()
    {
        let x = o[`${code}`];
        if (x != null)
        {
            quiz = x;
            $clearCMind.push(quiz);
        }
        else
        {
            showData = "잘못된 코드입니다."; 
        }
    }
    $: if (codeManager == "베드로153")
    {
        quiz = "오병이어";
    }
</script>

<div>
    <div style="padding: 15px;">
        <p>
        Zoom 소회의실에서 화이트보드 기능을 이용하여 제시어로 캐치마인드 게임을 진행하시면 됩니다. 
        캐치마인드 정답이 나왔을 때, 정답이 나온 채팅창과 Zoom 화면을 캡처하여 청년수련회 플러스친구로 보내주시면 코드를 회신해 드립니다.
        정답자에게 정답 코드를 귓속말로 전달하고, 정답자는 화이트보드 기능을 활용하여 캐치마인드 게임을 이어나가시면 됩니다.
        </p>
    </div>
    <hr class="hair-line">
    <div>
        제시어: {quiz}<br/>
        정답 코드: <input bind:value={code} />
        <button disabled={timeout | end} class="pretty" on:click={showNext}>제시어 확인하기</button>
        <br/>{showData}
    </div>
</div>


<style>
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