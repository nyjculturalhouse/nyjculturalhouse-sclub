let curStep = 1;
let selDay = '';
let selClub = '';
let selMembers = [];

// 추가: preload 데이터 저장
let ALL_CLUB_DATA = [];

function adminAuth() {

    const pw = prompt("관리자 비밀번호를 입력하세요.");

    if (pw === "0226") {

        loadStats();

    } else if (pw !== null) {

        alert("비밀번호가 올바르지 않습니다.");

        location.href = "index.html";
    }
}

async function loadStats() {

    const box = document.getElementById('admin-content');

    box.innerHTML = `
        <p style="text-align:center; padding:20px;">
            데이터 분석 중...
        </p>
    `;

    try {

        const stats = await apiGet("getStats");

        if(!stats || stats.length === 0) {

            box.innerHTML = `
                <p style="text-align:center; padding:20px;">
                    출석 기록이 없습니다.
                </p>
            `;

            return;
        }

        stats.sort((a, b) => b.week.localeCompare(a.week));

        let html = `
            <table>
                <tr>
                    <th>날짜 (주차)</th>
                    <th>전체 인원</th>
                </tr>
        `;

        stats.forEach(s => {

            html += `
                <tr>
                    <td>${s.week}</td>
                    <td style="font-weight:bold; color:#3182f6;">
                        ${s.total}명
                    </td>
                </tr>
            `;
        });

        html += `</table>`;

        box.innerHTML = html;

    } catch (e) {

        box.innerHTML = `
            <p style="text-align:center; color:red;">
                불러오기 실패
            </p>
        `;
    }
}

// 추가: 첫 진입 preload
async function preloadClubData() {

    try {

        ALL_CLUB_DATA = await apiGet("getAllClubData");

    } catch(e) {

        console.log(e);
    }
}

function initDays() {

    showStep(1);

    // preload 실행
    preloadClubData();

    const days = ['화','수','목','금','토','일'];

    const box = document.getElementById('day-buttons');

    box.innerHTML = '';

    days.forEach(d => {

        const b = document.createElement('button');

        b.className = 'btn';

        b.innerText = d + '요일';

        b.onclick = () => {

            // 추가: 진동 피드백
            if(navigator.vibrate) {
                navigator.vibrate(30);
            }

            b.classList.add('selected');

            selDay = d;

            // 속도 개선
            loadClubs(d);
        };

        box.appendChild(b);
    });
}

async function loadClubs(day) {

    showStep(2);

    const box = document.getElementById('club-buttons');

    box.innerHTML = '';

    // preload 데이터 사용
    const clubs = [
        ...new Set(
            ALL_CLUB_DATA
                .filter(c => c.day === day)
                .map(c => c.club)
        )
    ];

    clubs.forEach(c => {

        const b = document.createElement('button');

        b.className = 'btn';

        b.innerText = c;

        b.onclick = () => {

            // 추가: 진동 피드백
            if(navigator.vibrate) {
                navigator.vibrate(30);
            }

            b.classList.add('selected');

            selClub = c;

            // 속도 개선
            loadMembers(c);
        };

        box.appendChild(b);
    });
}

async function loadMembers(club) {

    showStep(3);

    document.getElementById('club-title').innerText = club;

    const box = document.getElementById('member-list');

    box.innerHTML = '';

    selMembers = [];

    // preload 데이터 사용
    const found = ALL_CLUB_DATA.find(c => c.club === club);

    const members = found ? found.members : [];

    members.forEach(m => {

        const b = document.createElement('button');

        b.className = 'btn';

        b.innerText = m;

        b.onclick = () => {

            // 추가: 진동 피드백
            if(navigator.vibrate) {
                navigator.vibrate(20);
            }

            b.classList.toggle('selected');

            const i = selMembers.indexOf(m);

            if(i > -1) {
                selMembers.splice(i, 1);
            } else {
                selMembers.push(m);
            }
        };

        box.appendChild(b);
    });
}

async function sendPost(mode) {

    let data = {
        mode: mode
    };

    if(mode === 'submitAttendance') {

        data.clubName = selClub;

        data.attendees = selMembers;

    } else if(mode === 'submitBooking') {

        data.name = document.getElementById('b_name').value;

        let phone = document.getElementById('b_phone').value
            .replace(/[^0-9]/g, '');

        if(phone.length === 11) {

            phone =
                phone.slice(0, 3) + '-' +
                phone.slice(3, 7) + '-' +
                phone.slice(7);

        } else if(phone.length === 10) {

            phone =
                phone.slice(0, 3) + '-' +
                phone.slice(3, 6) + '-' +
                phone.slice(6);
        }

        data.phone = phone;

        data.space = document.getElementById('b_space').value;
        data.content = document.getElementById('b_content').value;
        data.dateTime = document.getElementById('b_date').value;
        data.hours = document.getElementById('b_hours').value;

        if(!data.name || !data.dateTime) {
            return alert("필수 정보를 입력해주세요.");
        }

    } else if(mode === 'submitExternal') {

        data.club = document.getElementById('e_club').value;

        let phone = document.getElementById('e_phone').value
            .replace(/[^0-9]/g, '');

        if(phone.length === 11) {

            phone =
                phone.slice(0, 3) + '-' +
                phone.slice(3, 7) + '-' +
                phone.slice(7);

        } else if(phone.length === 10) {

            phone =
                phone.slice(0, 3) + '-' +
                phone.slice(3, 6) + '-' +
                phone.slice(6);
        }

        data.phone = phone;

        data.event = document.getElementById('e_event').value;
        data.content = document.getElementById('e_content').value;
        data.dateTime = document.getElementById('e_date').value;

        if(!data.club || !data.dateTime) {
            return alert("필수 정보를 입력해주세요.");
        }
    }

    const submitBtns = document.querySelectorAll('.primary');

    submitBtns.forEach(btn => {
        btn.disabled = true;
    });

    // 추가: 진동 피드백
    if(navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
    }

    await apiPost(data);

    showCompleteToast();
}

function submitAttendance() {

    if(!selMembers.length) {
        return alert("인원을 선택하세요.");
    }

    sendPost('submitAttendance');
}

function showStep(s) {

    curStep = s;

    document
        .getElementById('step-days')
        ?.classList.toggle('hidden', s !== 1);

    document
        .getElementById('step-clubs')
        ?.classList.toggle('hidden', s !== 2);

    document
        .getElementById('step-members')
        ?.classList.toggle('hidden', s !== 3);
}

// 추가: 전화번호 자동 하이픈
document.addEventListener('DOMContentLoaded', () => {

    const phones = [
        document.getElementById('b_phone'),
        document.getElementById('e_phone')
    ];

    phones.forEach(input => {

        if(!input) return;

        input.addEventListener('input', e => {

            let num = e.target.value.replace(/[^0-9]/g, '');

            if(num.length > 11) {
                num = num.slice(0, 11);
            }

            if(num.length < 4) {

                e.target.value = num;

            } else if(num.length < 8) {

                e.target.value =
                    num.slice(0, 3) + '-' +
                    num.slice(3);

            } else {

                e.target.value =
                    num.slice(0, 3) + '-' +
                    num.slice(3, 7) + '-' +
                    num.slice(7);
            }
        });
    });

    // 추가: 날짜 UX 개선
    const dates = [
        document.getElementById('b_date'),
        document.getElementById('e_date')
    ];

    dates.forEach(input => {

        if(!input) return;

        input.min = new Date().toISOString().slice(0,16);
    });
});
