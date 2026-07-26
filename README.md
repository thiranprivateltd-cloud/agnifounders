# AgniFounders Website - Developer Guide

Production-ready, responsive, multi-page website built with pure **HTML5**, **CSS3**, and **Vanilla JavaScript** (no frameworks, no Tailwind/Bootstrap dependencies) for **AgniFounders** (formerly Udayam) — India's movement for young student founders, powered by **Thiran Private Limited**.

---

## 📂 Project Directory Structure

```text
/
├── index.html           # Homepage
├── about.html           # Our story, values, founder biography
├── membership.html      # Tiers pricing, UPI checkout guides, FAQs
├── members.html         # Founding members directory with search & filters
├── events.html          # Upcoming & past events, host chapter request embeds
├── blog.html            # Insights list & featured article post
├── blog-post.html       # Individual article reading layout template
├── contact.html         # General contact, ambassador application forms
├── 404.html             # Custom 404 error page redirection
├── robots.txt           # SEO crawl configuration
├── sitemap.xml          # Search engine pages sitemap
├── README.md            # Project guide (this document)
├── /css
│   ├── global.css       # Core variables, reset, glass navbar, footer, buttons
│   ├── home.css         # Hero layout, noise overlay, stats counters
│   ├── membership.css   # Expandable form frames, pricing tiers, FAQs layout
│   ├── members.css      # Filters dashboard, search box, avatar classes
│   ├── events.css       # Event badges, photo frames, chapter applications
│   └── contact.css      # Standard labels inputs, ambassador embeds
└── /js
    ├── global.js        # Scroll triggers, active navigation tabs, cookie banner
    ├── home.js          # Interactive Plexus canvas background, counter animations
    ├── membership.js    # Accordion triggers, Google Form dynamic frames expander
    └── members.js       # Filter selectors & name search intersection matching
```

---

## 🛠️ Local Development & Previewing

To run a lightweight local development server to test page transitions and responsive breakpoints:

1. **Python Server (Recommended)**:
   Open terminal inside the directory:
   ```bash
   python -m http.server 8000
   ```
   Open `http://localhost:8000` in your web browser.

2. **Vercel Deployments**:
   This project contains zero build configurations and runs as static assets out-of-the-box. Simply upload the files or run:
   ```bash
   vercel
   ```

---

## 🧑‍💻 How-To Updates & Maintenance

### 1. Adding/Editing Members in Catalog
Open [members.html](file:///C:/Users/gsvar/.gemini/antigravity/scratch/agnifounders/members.html) and find the `<div id="members-grid">` tag. Insert a new member card with matching properties:

```html
<article class="card member-card" data-city="[CITY_NAME]" data-domain="[Tech/Edtech/Commerce/Social/Other]" data-tier="[Spark/Builder/Founder Pro]">
  <div class="member-header">
    <!-- Circle Initials Avatar (use classes: avatar-orange, avatar-blue, avatar-purple, avatar-green) -->
    <div class="avatar-circle avatar-orange">[INITIALS]</div>
    <div class="member-meta-title">
      <h3>[FULL_NAME]</h3>
      <p class="member-college">[COLLEGE_NAME]</p>
    </div>
  </div>
  <div class="member-body">
    <p class="member-city"><i data-lucide="map-pin"></i> [CITY_NAME], [STATE]</p>
    <p class="member-startup"><i data-lucide="rocket"></i> <strong>[STARTUP_NAME]</strong></p>
    <div class="member-tags">
      <span class="domain-tag">[Tech/Edtech/Commerce/Social/Other]</span>
      <span class="tier-tag [badge-pro/badge-builder/badge-spark]">[Spark/Builder/Founder Pro]</span>
    </div>
  </div>
  <div class="member-footer">
    <a href="[LINKEDIN_URL]" target="_blank" rel="noopener noreferrer" class="member-linkedin"><i data-lucide="linkedin"></i> Connect</a>
  </div>
</article>
```
*Note: Make sure your `data-city` attribute value matches one of the options in the `#filter-city` select dropdown at the top of the page so the filter matches it correctly.*

### 2. Posting Upcoming Events
Open [events.html](file:///C:/Users/gsvar/.gemini/antigravity/scratch/agnifounders/events.html) and locate the `<div class="events-grid">` tag:

```html
<article class="card event-card">
  <div class="event-image-placeholder">
    <!-- Icon matching layout (monitor / users / code-2) -->
    <i data-lucide="monitor"></i>
    <!-- Format Badge (virtual / offline / hybrid) -->
    <span class="event-format-badge [virtual/offline/hybrid]">[Virtual/Offline/Hybrid]</span>
  </div>
  <div class="event-details-content">
    <div class="event-schedule">
      <span><i data-lucide="calendar"></i> [DATE]</span>
      <span><i data-lucide="clock"></i> [TIME]</span>
    </div>
    <h3>[EVENT_TITLE]</h3>
    <p class="event-location"><i data-lucide="map-pin"></i> [LOCATION_NAME]</p>
    <p class="event-desc">[SHORT_DESCRIPTION_EXCERPT]</p>
    <a href="[REGISTRATION_GOOGLE_FORM_LINK]" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm mt-1">Register Now <i data-lucide="arrow-up-right"></i></a>
  </div>
</article>
```

### 3. Adding New Blog Insights
To list a new blog post in [blog.html](file:///C:/Users/gsvar/.gemini/antigravity/scratch/agnifounders/blog.html), insert a post card inside the `<div class="blog-grid">` element:

```html
<article class="card blog-post-card">
  <div class="blog-post-img-placeholder"><i data-lucide="[ICON_NAME]"></i></div>
  <div class="blog-post-content">
    <div class="blog-meta">
      <span class="blog-cat-tag [cat-founder-story/cat-opportunities/cat-startup-101/cat-events/cat-from-thiran]">[Category]</span>
      <span class="blog-date">[DATE]</span>
    </div>
    <h3><a href="[ARTICLE_LINK].html">[ARTICLE_TITLE]</a></h3>
    <p class="blog-excerpt">[ONE_LINE_EXCERPT]</p>
    <a href="[ARTICLE_LINK].html" class="read-more-link mt-1">Read more <i data-lucide="arrow-right"></i></a>
  </div>
</article>
```
To build the actual article reader page, copy [blog-post.html](file:///C:/Users/gsvar/.gemini/antigravity/scratch/agnifounders/blog-post.html) structure, rename it, and write your content inside the `<div class="article-body">` wrapper tag.
