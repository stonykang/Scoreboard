/**
 * ⚠️ [중요] 구글 앱스 스크립트 배포 URL
 */
const API_URL =
  "https://script.google.com/macros/s/AKfycbyTnSWqglAhQ0S4XZo4zoRoyv3M3bSjGU_Q9R923iOvnCLFjHtjqjhyk1H3fZzoFzyA/exec";

const container = document.getElementById("scoreboard-container");
const teamElements = {};
let isFirstLoad = true;

// 화면 크기에 따라 줄 높이 계산
function getRowHeight() {
  return window.innerWidth < 768 ? 70 : 88;
}

async function fetchAndRender() {
  try {
    // 로딩 지연 시 안내 메시지
    if (isFirstLoad) {
      setTimeout(() => {
        const debugMsg = document.getElementById("debug-msg");
        if (debugMsg && isFirstLoad) debugMsg.classList.remove("hidden");
      }, 5000);
    }

    const response = await fetch(API_URL);

    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);

    const data = await response.json();

    if (isFirstLoad) {
      container.innerHTML = "";
      isFirstLoad = false;
    }

    // 1. 점수 내림차순 정렬
    data.sort((a, b) => b.score - a.score);

    // 2. 컨테이너 높이 조정
    const ROW_HEIGHT = getRowHeight();
    container.style.height = `${data.length * ROW_HEIGHT}px`;

    const currentTeams = new Set();
    
    // [동점자 처리 변수] 
    // 이전 점수와 순위를 기억해서 비교
    let lastScore = -1; 
    let rankForStyle = 0; // 색상 결정을 위한 '진짜 순위'

    data.forEach((item, index) => {
      const teamName = item.team;
      currentTeams.add(teamName);

      // 요소 생성 (Create)
      if (!teamElements[teamName]) {
        const el = document.createElement("div");
        el.className = `team-card flex items-center rounded-lg border border-border bg-card/80 backdrop-blur px-4 md:px-6 shadow-sm`;
        container.appendChild(el);
        teamElements[teamName] = el;
      }

      const el = teamElements[teamName];
      
      // [핵심 로직: 순위 계산]
      const realRank = index + 1; // 실제 현재 위치 (1, 2, 3, 4...)
      let displayRank = realRank; // 화면에 표시할 글자 ('1', '2', '-')

      // 이전 사람과 점수가 같은지 확인
      if (item.score === lastScore) {
        // 동점인 경우: 표시는 '-'로 하되, 스타일(색상)은 1등 그룹이면 금색 유지
        displayRank = "-";
        // rankForStyle은 변하지 않고 이전 순위(그룹의 1등 순위)를 유지함
      } else {
        // 점수가 다르면: 새로운 순위 시작
        rankForStyle = realRank;
        displayRank = realRank;
        // 현재 점수를 마지막 점수로 업데이트
        lastScore = item.score;
      }

      // 순위별 색상 및 효과 설정 (rankForStyle 기준)
      let rankColor = "text-zinc-500 bg-zinc-800/50";
      let borderClass = "border-border";

      if (rankForStyle === 1) {
        rankColor = "text-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/50";
        borderClass = "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
      } else if (rankForStyle === 2) {
        rankColor = "text-slate-300 bg-slate-400/10 ring-1 ring-slate-400/50";
        borderClass = "border-slate-500/50";
      } else if (rankForStyle === 3) {
        rankColor = "text-orange-400 bg-orange-400/10 ring-1 ring-orange-400/50";
        borderClass = "border-orange-500/50";
      }

      // 클래스 업데이트
      el.className = `team-card flex items-center rounded-lg border ${borderClass} bg-card/80 backdrop-blur px-3 md:px-6 shadow-sm`;

      // 내용 업데이트 (HTML)
      // displayRank 변수를 사용하여 '-' 또는 숫자를 표시
      el.innerHTML = `
                <div class="grid grid-cols-12 gap-2 md:gap-4 w-full items-center">
                    <div class="col-span-2 flex justify-center">
                        <span class="inline-flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full text-xs md:text-sm font-bold ${rankColor}">
                            ${displayRank}
                        </span>
                    </div>
                    <div class="col-span-6 pl-2">
                        <span class="font-semibold text-white tracking-tight text-sm md:text-lg truncate block">
                            ${item.team}
                        </span>
                    </div>
                    <div class="col-span-4 text-right">
                        <span class="font-mono font-bold text-emerald-400 text-sm md:text-xl">
                            ${Number(item.score).toLocaleString()}<span class="text-xs md:text-base text-emerald-600 ml-1">J달러</span>
                        </span>
                    </div>
                </div>
            `;

      // 위치 이동
      el.style.top = `${index * ROW_HEIGHT}px`;
    });

    // 사라진 팀 제거
    for (const team in teamElements) {
      if (!currentTeams.has(team)) {
        teamElements[team].remove();
        delete teamElements[team];
      }
    }
  } catch (error) {
    console.error("데이터 로딩 실패:", error);
    if (isFirstLoad) {
      container.innerHTML = `
                <div class="text-center py-10 text-red-500 bg-zinc-900 rounded-lg border border-red-900 mx-4">
                    <p class="font-bold text-lg">데이터 연결 실패</p>
                    <p class="text-sm mt-2 text-zinc-400">구글 시트 배포 설정을 확인해주세요.</p>
                    <p class="text-xs mt-4 text-zinc-600 font-mono bg-black p-2 rounded inline-block max-w-full overflow-hidden text-ellipsis">${error.message}</p>
                </div>
            `;
    }
  }
}

fetchAndRender();
setInterval(fetchAndRender, 3000);
window.addEventListener("resize", fetchAndRender);