// 한국식 화폐 단위(조/억/만) 축약 입력 파싱 + 표시.
// "5억", "12.5억", "1조2000억500만" 처럼 입력해도 정확한 숫자로 환산해서
// 강화 비용을 일일이 0을 다 채워 입력하지 않아도 되게 한다.
const UNITS = [
  ['조', 1e12],
  ['억', 1e8],
  ['만', 1e4],
];

export function parseKoreanCurrency(input) {
  if (input === null || input === undefined) return 0;
  const str = String(input).trim();
  if (str === '') return 0;
  if (!/[조억만]/.test(str)) {
    const n = Number(str.replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }
  let remaining = str.replace(/,/g, '');
  let total = 0;
  for (const [unit, value] of UNITS) {
    const match = remaining.match(new RegExp(`([0-9]*\\.?[0-9]+)\\s*${unit}`));
    if (match) {
      total += parseFloat(match[1]) * value;
      remaining = remaining.replace(match[0], '');
    }
  }
  const rest = remaining.replace(/[^0-9.]/g, '');
  if (rest) total += parseFloat(rest) || 0;
  return Math.round(total);
}

export function formatKoreanCurrency(n) {
  const num = Math.round(Number(n) || 0);
  if (num === 0) return '0';
  const parts = [];
  let remain = num;
  for (const [unit, value] of UNITS) {
    if (remain >= value) {
      const count = Math.floor(remain / value);
      parts.push(`${count.toLocaleString('ko-KR')}${unit}`);
      remain %= value;
    }
  }
  if (remain > 0) parts.push(remain.toLocaleString('ko-KR'));
  return parts.join(' ');
}
