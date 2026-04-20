import YahooFinanceClass from 'yahoo-finance2';

// Shared instance — suppress the survey notice banner
const yahooFinance = new YahooFinanceClass({
  suppressNotices: ['yahooSurvey'],
} as any);

export default yahooFinance;
