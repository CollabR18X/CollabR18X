# Design Guidelines: Modern Authentication & Profile Application

## Design Approach: Linear-Inspired System

**Selected Framework**: Hybrid approach drawing from Linear's precision and Notion's clarity, with Material Design form patterns for authentication flows.

**Rationale**: Authentication and profile management demand clarity, trustworthiness, and efficiency. Linear's typography hierarchy and Notion's spatial organization create professional, modern interfaces where users feel confident managing sensitive data.

---

## Typography System

**Primary Font**: Inter (Google Fonts) - 400, 500, 600 weights
**Monospace**: JetBrains Mono for tokens/codes

**Hierarchy**:
- Hero/Display: text-5xl to text-6xl, font-semibold, tracking-tight
- Page Titles: text-3xl, font-semibold
- Section Headers: text-xl, font-medium
- Body Text: text-base, leading-relaxed
- Captions/Labels: text-sm, text-gray-600
- Buttons: text-sm, font-medium, letter-spacing slight increase

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing (within components): 2, 4
- Component internal: 6, 8
- Between sections: 12, 16, 24
- Page padding: 16 on mobile, 24 on desktop

**Container Strategy**:
- Marketing pages: max-w-7xl
- App content: max-w-6xl
- Forms: max-w-md centered
- Dashboard: max-w-full with inner constraints

**Grid System**: 12-column responsive grid, gap-6 to gap-8

---

## Core Component Library

### Navigation
**Public Header**: Logo left, nav links center, "Sign In" + "Get Started" (primary button) right, sticky with subtle border-bottom on scroll, h-16
**App Header**: Compact h-14, logo, breadcrumb navigation, avatar dropdown right, search bar middle for larger screens

### Authentication Components
**Login/Signup Cards**: Centered on page, w-full max-w-md, rounded-lg border, p-8, shadow-sm
**Form Inputs**: Full-width, h-11, rounded-md, border, px-4, focus:ring-2, label above with text-sm font-medium mb-2
**Social Auth Buttons**: Icon left, text center, h-11, border, hover:bg-gray-50, mb-3
**Password Requirements**: Small checklist with check/x icons, text-xs, appears below password field

### Profile Components
**Avatar Display**: Multiple sizes - sm (h-8), md (h-12), lg (h-24), xl (h-32), rounded-full with ring-2 on focus
**Profile Card**: Split layout - left sidebar (avatar, basic info, navigation pills), right content area (tabbed sections)
**Settings Sections**: Bordered sections with mb-8, header with title + description, form fields below
**Action Buttons**: Secondary outlined for cancel, primary solid for save, aligned right

### Dashboard Elements
**Stat Cards**: Grid layout (2-3 columns), rounded-lg, border, p-6, icon top-left, large number, small label
**Activity Feed**: List items with avatar left, content middle, timestamp right, border-bottom except last
**Quick Actions**: Icon buttons in grid, rounded-lg, p-4, hover:bg-gray-50, icon + label vertical

---

## Key Page Layouts

### Landing Page (Public)
**Hero Section**: 60-70vh, two-column on desktop (text left 60%, image right 40%), single column mobile
- Large headline with gradient text treatment
- Subtitle text-xl
- CTA button group (primary "Get Started" + secondary "View Demo")
- Trust indicator below (small logos or user count)
- Background: Subtle gradient or abstract illustration

**Features Section**: 3-column grid on desktop, gap-8, py-24
- Icon top, title, description, optional link
- Each feature card has border, rounded-lg, p-8

**Social Proof**: 2-column testimonial grid, py-20, with photos

**CTA Section**: Full-width, centered content, py-16, contrasting background treatment

### Authentication Pages
**Layout**: Centered card on neutral background, optional brand illustration left side on desktop (split-screen)
**Forgot Password**: Simplified card, just email input + submit
**Two-Factor**: Large input fields for code, auto-advance between inputs

### Dashboard (Authenticated)
**Layout**: Sidebar navigation (w-64 hidden on mobile, overlay drawer), main content area with max-w-full
**Sidebar**: Logo top, nav items with icons, user profile bottom, border-right
**Main Content**: Breadcrumb, page title with action button, content grid below

### Profile Page
**Header**: Cover area (h-32) with avatar overlapping bottom edge
**Content**: Two-column (sidebar 1/3, content 2/3) on desktop, stacked mobile
**Tabs**: Border-bottom navigation for sections (Overview, Settings, Security, Notifications)

---

## Images

**Hero Image**: Full-bleed abstract dashboard illustration or user interface mockup (right 40% of hero section), high-quality PNG/WebP, showing app interface in context

**Feature Icons**: Use Heroicons (outline style) via CDN for all interface icons

**Testimonial Photos**: Circular avatars, h-12 w-12

**Cover/Background**: Subtle gradient meshes or geometric patterns for authentication pages and profile covers

**Buttons on Images**: When CTAs overlay hero image, apply backdrop-blur-md with semi-transparent background (bg-white/80)

---

## Interaction Patterns

**Form Validation**: Inline real-time validation with icons (checkmark/error) and helper text below fields
**Loading States**: Skeleton screens for content, spinner for buttons
**Notifications**: Toast messages top-right, slide-in animation, auto-dismiss 5s
**Modals**: Centered overlay, max-w-lg, backdrop blur, slide-up animation
**Empty States**: Centered icon, message, action button for dashboard sections with no data

---

## Accessibility Mandates

- Focus rings: ring-2 ring-offset-2 on all interactive elements
- Skip navigation link for keyboard users
- Consistent label associations (htmlFor/id)
- ARIA labels for icon-only buttons
- Minimum touch target: h-11 (44px)
- Form error announcements via ARIA live regions

---

**Design Philosophy**: Create trust through clarity. Every element serves user confidence—from precise form validation to thoughtful empty states. Professional doesn't mean boring; it means purposeful.