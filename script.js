/**
 * ⚠️ [중요] 구글 앱스 스크립트 배포 URL을 아래 따옴표 안에 넣으세요.
 * 주소 끝은 /exec 로 끝나야 합니다.
 */
const API_URL =
  "https://script.google.com/macros/s/AKfycbyTnSWqglAhQ0S4XZo4zoRoyv3M3bSjGU_Q9R923iOvnCLFjHtjqjhyk1H3fZzoFzyA/exec";

const container = document.getElementById("scoreboard-container");
const teamElements = {};
let isFirstLoad = true;

// 화면 크기에 따라 줄 높이 계산 (CSS와 일치해야 함)
function getRowHeight() {
  return window.innerWidth < 768 ? 70 : 88;
}

async function fetchAndRender() {
  try {
    // 로딩이 너무 오래 걸리면 안내 메시지 표시
    if (isFirstLoad) {
      setTimeout(() => {
        const debugMsg = document.getElementById("debug-msg");
        if (debugMsg && isFirstLoad) debugMsg.classList.remove("hidden");
      }, 5000);
    }

    const response = await fetch(API_URL);

    // 네트워크 응답 확인
    if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);

    const data = await response.json();

    // 데이터 수신 성공 시 로딩창 제거 (최초 1회)
    if (isFirstLoad) {
      container.innerHTML = "";
      isFirstLoad = false;
    }

    // 1. 점수 내림차순 정렬
    data.sort((a, b) => b.score - a.score);

    // 2. 컨테이너 전체 높이 조정
    const ROW_HEIGHT = getRowHeight();
    container.style.height = `${data.length * ROW_HEIGHT}px`;

    const currentTeams = new Set();

    data.forEach((item, index) => {
      const teamName = item.team;
      currentTeams.add(teamName);

      // 요소가 없으면 새로 생성 (Create)
      if (!teamElements[teamName]) {
        const el = document.createElement("div");
        // 초기 스타일 설정
        el.className = `team-card flex items-center rounded-lg border border-border bg-card/80 backdrop-blur px-4 md:px-6 shadow-sm`;
        container.appendChild(el);
        teamElements[teamName] = el;
      }

      const el = teamElements[teamName];
      const rank = index + 1;

      // 순위별 색상 및 효과 설정
      let rankColor = "text-zinc-500 bg-zinc-800/50";
      let borderClass = "border-border";

      if (rank === 1) {
        rankColor =
          "text-yellow-400 bg-yellow-400/10 ring-1 ring-yellow-400/50";
        borderClass =
          "border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]";
      } else if (rank === 2) {
        rankColor = "text-slate-300 bg-slate-400/10 ring-1 ring-slate-400/50";
        borderClass = "border-slate-500/50";
      } else if (rank === 3) {
        rankColor =
          "text-orange-400 bg-orange-400/10 ring-1 ring-orange-400/50";
        borderClass = "border-orange-500/50";
      }

      // 클래스 업데이트 (테두리 색상 등)
      el.className = `team-card flex items-center rounded-lg border ${borderClass} bg-card/80 backdrop-blur px-3 md:px-6 shadow-sm`;

      // 내용 업데이트 (HTML)
      el.innerHTML = `
                <div class="grid grid-cols-12 gap-2 md:gap-4 w-full items-center">
                    <div class="col-span-2 flex justify-center">
                        <span class="inline-flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full text-xs md:text-sm font-bold ${rankColor}">
                            ${rank}
                        </span>
                    </div>
                    <div class="col-span-6 pl-2">
                        <span class="font-semibold text-white tracking-tight text-sm md:text-lg truncate block">
                            ${item.team}
                        </span>
                    </div>
                    <div class="col-span-4 text-right">
                        <span class="font-mono font-bold text-emerald-400 text-sm md:text-xl">
                            ${Number(
                              item.score
                            ).toLocaleString()}<span class="text-xs md:text-base text-emerald-600 ml-1">원</span>
                        </span>
                    </div>
                </div>
            `;

      // 위치 이동 (top 좌표 변경 -> CSS transition 작동)
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
    // 에러 발생 시 화면 표시
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

// 초기 실행 및 3초 주기 갱신
fetchAndRender();
setInterval(fetchAndRender, 3000);

// 창 크기 변경 시 높이 재계산
window.addEventListener("resize", fetchAndRender);
