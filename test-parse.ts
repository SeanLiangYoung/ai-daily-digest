import fs from 'fs';

const content = fs.readFileSync('/tmp/x-lijigang.md', 'utf-8');

const lines = content.split('\n');
const startDate = '2026-04-13';
const endDate = '2026-04-20';
const currentYear = 2026;
const currentMonth = 4;

let currentTweet: any = {};
let contentBuffer: string[] = [];
let tweets: any[] = [];

function isWithinDateRange(dateStr: string, startDate: string, endDate: string) {
  if (!dateStr) return false;
  const tweetDate = dateStr.split('T')[0];
  return tweetDate >= startDate && tweetDate <= endDate;
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  
  // 匹配链接日期格式
  const fullDateMatch = line.match(/\[(\d{4})年(\d{1,2})月(\d{1,2})日\]\(([^)]+)\)/);
  const shortDateMatch = line.match(/\[(\d{1,2})月(\d{1,2})日\]\(([^)]+)\)/);
  
  // 纯文本日期
  const fullDateTextMatch = line.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日\s*$/);
  const shortDateTextMatch = line.match(/^(\d{1,2})月(\d{1,2})日\s*$/);
  
  if (fullDateMatch || shortDateMatch || fullDateTextMatch || shortDateTextMatch) {
    console.log('Date matched:', line.substring(0, 60));
    
    // 保存之前的推文
    if (contentBuffer.length > 0 && (currentTweet.url || currentTweet.createdAt)) {
      const content = contentBuffer.join('\n').trim();
      if (content && isWithinDateRange(currentTweet.createdAt || '', startDate, endDate)) {
        console.log('  -> Saved tweet:', currentTweet.createdAt, '| content:', content.substring(0, 30));
        tweets.push({...currentTweet, content});
      }
    }
    
    currentTweet = { username: 'lijigang' };
    contentBuffer = [];
    
    if (fullDateMatch) {
      const [, year, month, day] = fullDateMatch;
      currentTweet.createdAt = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + 'T00:00:00.000Z';
      currentTweet.url = fullDateMatch[4];
    } else if (shortDateMatch) {
      const [, month, day] = shortDateMatch;
      const monthNum = parseInt(month);
      const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
      currentTweet.createdAt = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + 'T00:00:00.000Z';
      currentTweet.url = shortDateMatch[3];
    } else if (fullDateTextMatch) {
      const [, year, month, day] = fullDateTextMatch;
      currentTweet.createdAt = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + 'T00:00:00.000Z';
      currentTweet.url = '';
    } else if (shortDateTextMatch) {
      const [, month, day] = shortDateTextMatch;
      const monthNum = parseInt(month);
      const year = monthNum > currentMonth ? currentYear - 1 : currentYear;
      currentTweet.createdAt = year + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0') + 'T00:00:00.000Z';
      currentTweet.url = '';
    }
    
    console.log('  -> New tweet date:', currentTweet.createdAt, 'url:', currentTweet.url ? 'yes' : 'no');
    continue;
  }
  
  // 收集内容
  if (line && (currentTweet.url || currentTweet.createdAt) && !line.startsWith('#') && !line.startsWith('---') && !line.startsWith('![') && !line.startsWith('http') && !line.startsWith('```')) {
    const cleanedLine = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    if (cleanedLine.trim() && cleanedLine.length > 2) {
      contentBuffer.push(cleanedLine);
    }
  }
}

console.log('\nTotal tweets found:', tweets.length);