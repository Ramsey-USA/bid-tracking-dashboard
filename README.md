# bid-tracking-dashboard
A comprehensive, responsive web application for tracking construction project bids, designed specifically for MH Construction's estimators and management team.
The dashboard will help us monitor the status of each bid, track key details, and improve our overall project management efficiency.

Project Goals

Centralized Bid Tracking: Create a single source of truth for all project bids for both companies, allowing for real-time visibility and collaboration.

Secure Access: Implement a robust login system to ensure that only authorized team members can access and manage bid data.

Streamlined Data Management: Log and track essential bid details, including client, project name, bid amount, and due date, with the ability to filter and search for specific information quickly.

Enhanced Reporting: Generate professional reports in common formats (PDF, spreadsheet) for leadership and internal records.

Technologies Used

HTML5: Serves as the foundational structure and content of the dashboard's user interface.

CSS3: Provides custom styling to ensure the dashboard is not only functional but also intuitive and visually appealing, with a clean and professional look.

JavaScript: Powers all dynamic functionality, including user interactions, data processing, and communication with the backend.

Core Functionality

Job Management: Add, edit, and delete construction project bids

Real-time Search: Search across project names, clients, and locations

Advanced Filtering: Filter by status and estimator

Dual View Modes: Switch between table and card views

Data Export: Export to Excel (CSV) and PDF formats

Deadline Tracking: Automatic overdue alerts and deadline notifications

Data Fields: Project Name; Client Information; Location; Assigned Estimator; Deadline with countdown; Project Status (In Progress, Submitted, Follow-up Required, Won, Lost, No Bid); Project Description

User Experience

Responsive Design: Optimized for desktop, tablet, and mobile devices

Professional Branding: Desert tan and military green color scheme

Intuitive Interface: Clean, construction industry-appropriate design

Local Data Storage: Persistent data storage in browser

Real-time Statistics: Live dashboard metrics

🎯 Usage Guide

Adding a New Job

1. Click the "Add New Job" button in the header

2. Fill in all required fields (marked with *)

3. Select appropriate status from dropdown

4. Add optional project description

5. Click "Save Job" to add to dashboard

Searching and Filtering

• Search: Use the search bar to find jobs by project name, client, or location

• Status Filter: Filter jobs by their current status

• Estimator Filter: Filter jobs by assigned estimator

• Clear Filters: Reset all filters to show all jobs

Viewing Options

• Table View: Comprehensive tabular display with all job details

• Card View: Clean card layout for easier browsing

Exporting Data

1. Click "Export Data" button

2. Choose between Excel (CSV) or PDF format

3. Select to export filtered results or all data

4. Download will start automatically

Managing Jobs

• Edit: Click the edit (✏️) button on any job to modify details

• Delete: Click the delete (🗑️) button to remove a job (with confirmation)

🎨 Customization

Branding

The dashboard uses MH Construction's brand colors:

• Primary Green: #4a5d23 (Military Green)

• Desert Tan: #d2b48c

• Supporting Colors: Various grays and status-specific colors

Adding New Status Options

To add new job statuses, modify the status options in:

1. index.html - Update the <select> elements for status

2. css/styles.css - Add corresponding status badge styles

3. js/app.js - Update status handling logic if needed

Modifying Data Fields

To add or modify data fields:

1. Update the form in index.html

2. Modify the CSS styling in styles.css

3. Update the JavaScript logic in app.js for data handling

📱 Mobile Support

The dashboard is fully responsive and optimized for:

• Desktop: Full-featured experience with all functionality

• Tablet: Adapted layout with touch-friendly controls

• Mobile: Streamlined interface perfect for field use

🔧 Technical Details

Browser Compatibility

• Chrome 60+

• Firefox 55+

• Safari 12+

• Edge 79+

Dependencies

• None: Pure HTML, CSS, and JavaScript - no external libraries required

• Fonts: Google Fonts (Inter) - gracefully degrades if unavailable

Data Storage

• Uses browser's localStorage for data persistence

• Data remains available between sessions

• No server or database required

Performance

• Lightweight: < 100KB total size

• Fast loading: Optimized CSS and JavaScript

• Efficient: Client-side filtering and search

🚀 Deployment Options

GitHub Pages (Free)

1. Push code to GitHub repository

2. Enable GitHub Pages in repository settings

3. Access via provided GitHub Pages URL

Static Hosting Services

• Netlify: Drag and drop deployment

• Vercel: Git-based deployment

• Firebase Hosting: Google's hosting platform

Traditional Web Hosting

Upload all files to any web server that supports static files.

🔒 Security Considerations

• All data stored locally in browser

• No server-side components or databases

• No sensitive data transmission

• HTTPS recommended for production deployment

📊 Sample Data

The dashboard includes three sample construction projects:

1. Downtown Office Complex - 12-story office building (In Progress)

2. Residential Subdivision Phase 2 - 45 single-family homes (Submitted)

3. Highway 101 Bridge Repair - Bridge structural repairs (Follow-up Required)

Sample data can be cleared by accessing browser developer tools and clearing localStorage.

🆘 Support & Troubleshooting

Common Issues

Dashboard not loading properly:

• Ensure all files are in correct directory structure

• Check browser console for JavaScript errors

• Verify files are served over HTTP/HTTPS (not file://)

Data not persisting:

• Check if localStorage is enabled in browser

• Ensure not in private/incognito mode

• Clear browser cache and reload

Mobile display issues:

• Ensure viewport meta tag is present

• Check CSS media queries are loading

• Test in different mobile browsers

Getting Help

For technical support or feature requests, please create an issue in the GitHub repository.

📄 License

This project is created specifically for MH Construction. All rights reserved.

🏗️ About MH Construction

This dashboard was custom-built for MH Construction's job bidding workflow, incorporating industry-specific requirements and branding to provide an optimal user experience for construction project management.
