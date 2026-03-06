import React from 'react';
import '../styles/FeedbackReport.css';

function FeedbackReport({ report }) {
  if (!report) return null;

  return (
    <div className="feedback-report">
      <h2>Your Feedback Report</h2>
      <p>Analysis and recommendations for your pitch</p>
      {/* WIP - Will display feedback details */}
    </div>
  );
}

export default FeedbackReport;
