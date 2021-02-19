<script>
    export let timeout;
    import {varypuzzlecount} from "./stores.js"
    let gameInfoStr = ""; //v:verse s:song h:sheet p:preach o:object q:speedquiz
    let answer, correction = "";
    const timer2 = 
    {
        timerId: null,
        timeLeft: 0,
        timerEnd: false,        
    }
    async function setSpeedquizTimer(second)
    {
        timer2.timerEnd = false;
        timer2.timerId = setInterval(() => {timer2.timeLeft--} , 1000)
        setTimeout(()=>{timer2.timerEnd = true ; clearInterval(timer2.timerId);} , second * 1000)
        timer2.timeLeft = second;
    }
    $: if (timeout == true) $varypuzzlecount = spdquiz.solved.length + p.clear.filter(x => x).length + s.clear.filter(x => x).length + h.clear.filter(x => x).length;
    let spdquiz = {
        spdstart: false, // 퀴즈 시작확인
        i: 0 ,//배열 저장용 인덱스
        idx: 1,//현재 문제
        quiz: 
        [
            null,
            `[창세기 1장] 태초에 천지를 창조하신 분은 누구이신가요?`,
            `[출애굽기 12장] 이스라엘 백성이 출애굽을 기념하여 지키는 절기는 무엇인가요?`,
            `[열왕기상 12장] 빈칸에 들어갈 알맞은 말은 무엇인가요?
솔로몬 왕 사후 이스라엘은 북왕국과 남왕국으로 분리됩니다. 북 이스라엘 여로보암 왕의 우상 숭배에 관한 아래 본문을 채우세요. 
'만일 이 백성이 예루살렘에 있는 여호와의 전에 제사를 드리고자 하여 올라가면 이 백성의 마음이 유다 왕 된 그 주 르호보암에게로 돌아가서 나를 죽이고 유다 왕 르호보암에게로 돌아가리로다 하고 이에 계획하고 두  _ _ _ _ 을(를) 만들고 무리에게 말하기를 너희가 다시는 예루살렘에 올라갈 것이 없도다 이스라엘아 이는 너희를 애굽 땅에서 인도하여 올린 너희 신이라 하고' `,
            `[요한계시록 11장] 다음 본문에 들어갈 숫자는 얼마인가요?
"일곱째 천사가 나팔을 불매 하늘에 큰 음성들이 나서 가로되 세상 나라가 우리 주와 그 그리스도의 나라가 되어 그가 세세토록 왕노릇 하시리로다 하니 하나님 앞에 자기 보좌에 앉은  _ _ 장로들이 엎드려 얼굴을 대고 하나님께 경배하여"`,
            `[요한복음 1장] "내 뒤에 오시는 이가 나보다 앞선 것은 나보다 먼저 계심이니라" 라는 말을 한 사람은? (_ _ _ _)`,
            `[출애굽기 40장] 이스라엘 백성들은 출애굽 후 성막을 건축했습니다. 성막 봉헌에 관한 다음 본문에 알맞은 말은 무엇인가요?  
'또 번제단을 회막의 성막 문 앞에 놓고 또  _ _ _ 을 회막과 단 사이에 놓고 그 속에 물을 담고 또 뜰 주위에 포장을 치고 뜰 문에 장을 달고'`,
            `[역대하 36장] 바사제국의 초대 왕으로 바벨론을 정복하였으며 유대 백성의 귀국을 허락하고 이스라엘 민족에게 유다로 돌아가서 성전을 재건하라고 권면한 사람은 누구인가요? (_ _ _)`,
            `[다니엘 3장] 다음은 우상 숭배를 거부한 다니엘의 친구들이 한 말입니다. 본문 빈 칸을 채우세요. 
"만일 그럴 것이면 왕이여 우리가 섬기는 우리 하나님이 우리를 극렬히 타는 풀무 가운데서 능히 건져내시겠고 왕의 손에서도 건져내시리이다 그리 아니하실찌라도 왕이여 우리가 왕의 신들을 섬기지도 아니하고 왕의 세우신  _ _ _ 에게 절하지도 아니할 줄을 아옵소서" `,
            `[요한계시록 21장] 다음은 새 예루살렘에 들어 갈 자격에 관한 요한계시록 말씀입니다다. 본문의 빈칸에 알맞은 말은 무엇인가요?
"사람들이 만국의 영광과 존귀를 가지고 그리로 들어오겠고 무엇이든지 속된 것이나 가증한 일 또는 거짓말 하는 자는 결코 그리로 들어오지 못하되 오직 어린 양의  _ _ _ 에 기록된 자들뿐이라"`,
            `[여호수아 2장] 여호수아가 여리고 성을 공격하기에 앞서 정탐을 보낸 일에 관한 아래 본문을 채우세요. 
'눈의 아들 여호수아가 싯딤에서 두 사람을 정탐으로 가만히 보내며 그들에게 이르되 가서 그 땅과 여리고를 엿보라 하매 그들이 가서 _ _이라 하는 기생의 집에 들어가 거기서 유숙하더니'`,
            `[에베소서 1장] 다음 성경 본문은 그리스도를 향한 하나님의 능력을 설명하고 있습니다. 본문의 빈칸에 들어갈 말은 무엇인가요?
"그 능력이 그리스도 안에서 역사하사 죽은 자들 가운데서 다시 살리시고 하늘에서 자기의 오른편에 앉히사 모든 정사와 권세와 능력과 주관하는 자와 이 세상뿐 아니라 오는 세상에 일컫는 모든 이름 위에 뛰어나게 하시고 또 만물을 그 발 아래 복종하게 하시고 그를 만물 위에 교회의 _ _ 로 주셨느니라"`,
            `[베드로전서 3장] 다음은 '선을 위한 고난'에 관한 베드로 후서 말씀입니다. 본문의 빈칸에 들어갈 말은 무엇인가요?
"그들은 전에 노아의 날 방주 예비할 동안 하나님이 오래 참고 기다리실 때에 순종치 아니하던 자들이라 방주에서 물로 말미암아 구원을 얻은 자가 몇명 뿐이니 겨우 _ _ 명이라"`,
            `구약성경의 마지막 책은 무엇일까요?`,
            `[빌립보서 4장] 다음은 바울이 빌립보교회 성도들에게 권면하는 내용입니다. 두 빈칸을 한 단어로 채우세요.
"주 안에서 항상 _ _ 하라 내가 다시 말하노니 _ _ 하라 너희 관용을 모든 사람에게 알게 하라 주께서 가까우시니라"`,
            `[갈라디아서 3장] 갈라디아서 3장에는 율법에 관하여 "이같이 율법이 우리를 그리스도에게로 인도하는 _ _ _ _ 가(이) 되어 우리로 하여금 믿음으로 말미암아 의롭다 함을 얻게 하려 함이니라"라고 기록되어 있습니다. 빈 칸에 알맞는 말을 채우세요.`,
            `[시편 46편] 다음은 하나님의 강력한 보호의 손길을 노래한 시의 일부입니다. 본문의 빈칸을 채우세요. 
'바닷물이 흉용하고 뛰놀든지 그것이 넘침으로 산이 요동할찌라도 우리는 두려워 아니하리로다 (셀라) 한 시내가 있어 나뉘어 흘러 하나님의 성 곧 지극히 높으신 자의 장막의 성소를 기쁘게 하도다 하나님이 그 성중에 거하시매 성이 요동치 아니할 것이라 _ _ 에 하나님이 도우시리로다'`,
            `[출애굽기 40장] 이스라엘 백성들은 출애굽 후 성막을 건축했습니다. 성막 봉헌에 관한 다음 본문의 빈칸을 채우세요.
'또 금 향단을 증거궤 앞에 두고 성막 문에 장을 달고 또 번제단을 _ _ 의 성막 문 앞에 놓고'`,
            `[역대하 17장] 다음은 여호와 보시기에 선정을 베풀었던 남 유다 여호사밧 왕의 업적과 그 시대 상황에 관한 기록입니다. 여호사밧의 강한 군대와 관련한 아래 본문의 빈칸을 채우세요. 
'여호사밧이 점점 강대하여 유다에 견고한 채와 국고성을 건축하고 유다 각 성에 역사를 많이 하고 또 예루살렘에 크게 용맹한 군사를 두었으니 군사의 수효가 그 족속대로 이러하니라 유다에 속한 천부장 중에는 _ _ _ 가 으뜸이 되어 큰 용사 삼십만을 거느렸고'`,
            `[여호수아 19장]
출애굽한 이스라엘 백성은 가나안을 정복한 후 지파별로 기업을 분배하였다. 이에 관한 아래 본문을 빈칸을 한 단어로 채우세요.
'여섯째로 _ _ _ 자손을 위하여 _ _ _ 자손의 가족대로 제비를 뽑았으니 그 경계는 헬렙과 사아난님의 상수리나무에서부터 아다미 네겝과 얍느엘을 지나 락굼까지요 그 끝은 요단이며 ... 이론과 믹다렐과 호렘과 벧 아낫과 벧 세메스니 모두 십 구 성읍이요 또 그 촌락이라 _ _ _ 자손의 지파가 그 가족대로 얻은 기업은 이 성읍들과 그 촌락이었더라'`,
            `신약성경의 첫번째 책은 무엇일까요?`
        ]
        
        ,//문제 해설 배열
        list: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],//풀이 가능한 문제 리스트
        ans:
        [
            null,
            '하나님', '유월절', '금송아지', '24', '세례요한', '물두멍', '고레스', '금신상', '생명책', '라합',
            '머리', '여덟', '말라기', '기뻐', '몽학선생', '새벽', '회막', '아드나', '납달리', '마태복음'
        ] 
        ,// 정답 배열
        solved: [] ,//푼 문제 체크
        end: false ,//끝남 체크
        nxtquiz: function(){
            if (spdquiz.list.length == 0)
            {
                spdquiz.end = true;
                return;
            }
            if (spdquiz.i == spdquiz.list.length - 1)
            {
                spdquiz.i = 0;
                spdquiz.idx = spdquiz.list[spdquiz.i];
            }
            else 
            {
                spdquiz.i++;
                spdquiz.idx = spdquiz.list[spdquiz.i]
            }
        }, //문제 넘김 함수
        sol: function(){
            let t = answer.replace(/\s/gi, "");
            if (t == spdquiz.ans[spdquiz.idx])
            {
                correction = "정답입니다."
                setTimeout(() => { correction = ""}, 1500);
                spdquiz.solved.push(spdquiz.idx)
                if (spdquiz.solved.length == 20)
                {
                    spdquiz.end = true;
                    return;
                }
                if (spdquiz.i == spdquiz.list.length - 1)
                {
                    spdquiz.i = 0;
                    spdquiz.idx = spdquiz.list[spdquiz.i]
                    return;
                }
            }
            else
            {
                correction = "오답입니다.";
            }
        } 
        // 풀이시 실행
    };
    let object = {
        tag: "none",
        none: "",
        hard: "도미노, 줄자, 애완동물, 오르골, CD, 폴더폰, 무드등, 국어사전, 카메라, 라디오",
        medium: "모자, A4용지, 스테이플러, 스피커, 시계, 무선충전기, 열쇠, 은혜와진리찬양집, 태극기, 가족사진",
        easy: "칫솔, 슬리퍼, 샤프, 선크림, 달력, USB, 포스트잇, 성경책, 건전지, 면봉, 손톱깎이",
        clearhard: false,
        clearmedium: false,
        cleareasy: false,
        clearnone: false,
        end: false,
        ans: {
            hard: "오병이어1252",
            medium: "팔복8135",
            easy: "만선15310"
        }
    };
    /*
    let v = {
        clear:[null, false, false, false],
        ans: [],
        check: function()
        {
            if (v.ans[parseInt(gameInfoStr[1])] == answer)
            {
                alert("정답입니다.");
                v.clear[parseInt(gameInfoStr[1])] = true;
            }
            else alert("오답입니다.")
        }
    }*/
    let s = {
        clear: [null, false, false, false],
        ans: [null, "온 땅이여 하나님께 즐거운 소리를 발할지어다", "하나님께서 우리를", "주는 나의 방패시요"],
        check: function()
        {
            if (s.ans[parseInt(gameInfoStr[1])] == answer)
            {
                alert("정답입니다.");
                s.clear[parseInt(gameInfoStr[1])] = true;
            }
            else alert("오답입니다.")
        }
    }
    let h = {
        clear: [null, false, false, false, false, false],
        ans: [null, "보라 대속의 십자가", "성도의 생활", "여호와는 자비로우시며", "내 영혼이 잠잠히", "아무 것도 염려치 말고" ],
        check: function()
        {
            if (h.ans[parseInt(gameInfoStr[1])] == answer)
            {
                alert("정답입니다.");
                h.clear[parseInt(gameInfoStr[1])] = true;
            }
            else alert("오답입니다.")
        }
    }
    let p = {
        clear: [null, false, false, false],
        ans: [null, "2021-02-08", "2020-06-01", "2020-02-24"],
        check: function()
        {
            if (p.ans[parseInt(gameInfoStr[1])] == answer)
            {
                alert("정답입니다.");
                p.clear[parseInt(gameInfoStr[1])] = true;
            }
            else alert("오답입니다.")
        }
    }
</script>
    <br/><br/>
    <!-- puzzle selector -->
    <div class="tab-items">
        <button disabled={timeout | s.clear[1]} class="pretty-grey" on:click='{() => gameInfoStr = "s1"}'>찬양 듣고 찬양 제목 맞히기 1</button>
        <button disabled={timeout | s.clear[2]} class="pretty-grey" on:click='{() => gameInfoStr = "s2"}'>찬양 듣고 찬양 제목 맞히기 2</button>
        <button disabled={timeout | s.clear[3]} class="pretty-grey" on:click='{() => gameInfoStr = "s3"}'>찬양 듣고 찬양 제목 맞히기 3</button>
        <button disabled={timeout | h.clear[1]} class="pretty-grey" on:click='{() => gameInfoStr = "h1"}'>악보 보고 찬양 제목 맞히기 1</button>
        <button disabled={timeout | h.clear[2]} class="pretty-grey" on:click='{() => gameInfoStr = "h2"}'>악보 보고 찬양 제목 맞히기 2</button>
        <button disabled={timeout | h.clear[3]} class="pretty-grey" on:click='{() => gameInfoStr = "h3"}'>악보 보고 찬양 제목 맞히기 3</button>
        <button disabled={timeout | h.clear[4]} class="pretty-grey" on:click='{() => gameInfoStr = "h4"}'>악보 보고 찬양 제목 맞히기 4</button>
        <button disabled={timeout | h.clear[5]} class="pretty-grey" on:click='{() => gameInfoStr = "h5"}'>악보 보고 찬양 제목 맞히기 5</button>
        <button disabled={timeout | p.clear[1]} class="pretty-grey" on:click='{() => gameInfoStr = "p1"}'>설교 영상 날짜 맞히기 1</button>
        <button disabled={timeout | p.clear[2]} class="pretty-grey" on:click='{() => gameInfoStr = "p2"}'>설교 영상 날짜 맞히기 2</button>
        <button disabled={timeout | p.clear[3]} class="pretty-grey" on:click='{() => gameInfoStr = "p3"}'>설교 영상 날짜 맞히기 3</button>
        <button disabled={timeout | spdquiz.end | timer2.timerEnd | spdquiz.spdstart} class="pretty-grey" on:click='{() => gameInfoStr = "q"}'>스피드퀴즈</button>
        <button disabled={timeout | object.end} class="pretty-grey" on:click='{() => gameInfoStr = "o"}'>물건 찾기</button>
    </div>
    <!-- puzzle show-->
    <div style="text-align: center; padding: 15px">
        {#if gameInfoStr[0] == 's'}
            <div>
                이 게임은 찬양의 일부분을 듣고 곡명을 맞히는 게임입니다. 곡명을 띄어쓰기를 포함하여 <b>정확하게</b> 입력해야 합니다.
            </div>
            {#if gameInfoStr[1] == '1'}
                <div>
                    <audio controls>
                        <source src="./data/s/s1.mp3" type="audio/mpeg">
                        <track kind="captions" src="./data/etc.vtt">
                        크롬 브라우저를 이용해 주세요
                    </audio><br/>   
                </div>
            {:else if gameInfoStr[1] == '2'}
                <div>
                    <audio controls>
                        <source src="./data/s/s2.mp3" type="audio/mpeg">
                        <track kind="captions" src="./data/etc.vtt">
                        크롬 브라우저를 이용해 주세요
                    </audio><br/>
                </div>
            {:else if gameInfoStr[1] == '3'}
                <div>
                    <audio controls>
                        <source src="./data/s/s3.mp3" type="audio/mpeg">
                        <track kind="captions" src="./data/etc.vtt">
                        크롬 브라우저를 이용해 주세요
                    </audio><br/>
                </div>
            {:else} 
                <div>오류가 발생했습니다.</div>
            {/if}
            <div>
                정답: <input bind:value={answer}/> <button class="pretty" disabled={s.clear[parseInt(gameInfoStr[1])]} on:click={s.check}>정답 확인</button>
            </div>
        {:else if gameInfoStr[0] == 'h'}
            <div>
                이 게임은 악보의 일부분을 보고 곡명을 맞히는 게임입니다. 곡명을 띄어쓰기를 포함하여 <b>정확하게</b> 입력해야 합니다.
            </div>
            {#if gameInfoStr[1] == '1'}
                <div>
                    <img src="./data/h/h1.png" alt="secret"/><br/>   
                </div>
            {:else if gameInfoStr[1] == '2'}
                <div>
                    <img src="./data/h/h2.png" alt="secret"/><br/>
                </div>
            {:else if gameInfoStr[1] == '3'}
                <div>
                    <img src="./data/h/h3.png" alt="secret"/><br/>
                </div>
            {:else if gameInfoStr[1] == '4'}
                <div>
                    <img src="./data/h/h4.png" alt="secret"/><br/>
                </div>
            {:else if gameInfoStr[1] == '5'}
                <div>
                    <img src="./data/h/h5.png" alt="secret"/><br/>
                </div>
            {:else} 
                <div>오류가 발생했습니다.</div>
            {/if}
            <div>
                정답: <input bind:value={answer}/> <button class="pretty" disabled={h.clear[parseInt(gameInfoStr[1])]} on:click={h.check}>정답 확인</button>
            </div>
        {:else if gameInfoStr[0] == 'p'}
            <div>
                이 게임은 주어진 영상의 길이에 맞는 설교 영상의 날짜를 찾는 게임입니다. 
            </div>
            {#if gameInfoStr[1] == '1'}
                <div>
                    55분 14초
                </div>
            {:else if gameInfoStr[1] == '2'}
                <div>
                    1시간 0분 49초
                </div>
            {:else if gameInfoStr[1] == '3'}
                <div>
                    54분 46초
                </div>
            {:else} 
                <div>오류가 발생했습니다.</div>
            {/if}
            <div>
                정답: <input type="date" bind:value={answer}/> <button  class="pretty" disabled={p.clear[parseInt(gameInfoStr[1])]} on:click={p.check}>정답 확인</button>
            </div>
        {:else if gameInfoStr[0] == 'o'}
            <p>
                주어진 제시어에 해당하는 물건 <b>8 개 이상</b>을 찾아서 청년수련회 카카오톡 플러스친구 계정으로 보내주시면 코드를 받을 수 있습니다.
            </p>
            <div>
                난이도 선택<br/>
                <button class="pretty" disabled={timeout | object[`clear${object.tag}`]} on:click='{() => {object.tag = 'hard'}}'>상</button> 
                <button class="pretty" disabled={timeout | object[`clear${object.tag}`]} on:click='{() => {object.tag = 'medium'}}'>중</button> 
                <button class="pretty" disabled={timeout | object[`clear${object.tag}`]} on:click='{() => {object.tag = 'easy'}}'>하</button> 
            </div>
            <br/>
            <hr class="hair-line"><br/>
            <div>
                제시어: {object[object.tag]}<br/> 
                코드 입력하기: <input bind:value={answer}/>
                    <button class="pretty" disabled={timeout | object.end} on:click='{
                        () => 
                        {
                            if (object.tag == "none") { alert("올바르지 않은 접근입니다."); return;};
                            if (answer == object.ans[object.tag])
                            {
                                alert("정답입니다!");
                                object[`clear${object.tag}`] = true;
                                if(object.clearhard && object.clearmedium && object.cleareasy)
                                {
                                    object.end = true;
                                }
                            } 
                            else alert("코드가 올바르지 않습니다.")}
                        }'>정답 확인!</button>
                    {#if object.end}
                        <br/>모든 물건을 다 찾았습니다!
                    {/if}
            </div>
        {:else if gameInfoStr[0] == 'q'}
            <div id="timer" class="big">
                <b>{parseInt(timer2.timeLeft / 60)} : {timer2.timeLeft % 60}</b>
            </div>
            <p>한 번 스피드퀴즈를 시작한 뒤에는 다시 도전할 수 없습니다! 준비되었으면 시작해 주세요! 본 퀴즈는 모두 주관식입니다.</p>
            <button class="pretty" disabled={spdquiz.spdstart} on:click='{() => {setSpeedquizTimer(180); spdquiz.spdstart = true;}}'>스피드퀴즈 시작하기</button>
            {#if spdquiz.spdstart}
            <hr class="hair-line"/>
            <div>
                문제 {spdquiz.idx}번
                <p>
                    {spdquiz.quiz[spdquiz.idx]}
                </p>
                    정답: <input bind:value={answer}/>
                <div>
                    <button class="pretty" disabled={timeout | spdquiz.end | timer2.timerEnd | !spdquiz.spdstart | spdquiz.solved.includes(spdquiz.idx)} on:click={spdquiz.sol}>정답 확인하기!</button>
                    <button class="pretty" disabled={timeout | spdquiz.end | timer2.timerEnd | !spdquiz.spdstart} on:click={spdquiz.nxtquiz}>다음문제</button>
                    <p>{correction}
                        {#if spdquiz.end}
                            <br/>모든 문제를 다 푸셨습니다!
                        {/if}
                    </p>
                </div>
            </div>
            {/if}
        {:else}
            <div>문제를 선택해 주세요.</div>
        {/if}
    </div>


<style>

    img
    {
        width: 90%;
        height: auto;
    }
    .tab-items
    {
        display: flex;
        justify-content: space-between;
        flex-direction: row;
        border-radius: 5px;
        background-color:darkgray;
        flex-wrap:wrap;
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