import { Component } from "solid-js";

interface HeaderProps {
  venueId: string;
  language: string;
  onVenueChange: (venueId: string) => void;
  onLanguageChange: (language: string) => void;
}

export const Header: Component<HeaderProps> = (props) => {
  return (
    <header class="topbar">
      <div>
        <p class="eyebrow">Challenge 4 prototype</p>
        <h1>World Cup 2026 StadiumOps Copilot</h1>
        <p class="subtitle">
          A GenAI-enabled command center that turns venue telemetry into multilingual fan guidance, accessible route changes, crowd actions, transit coordination, and sustainability decisions.
        </p>
      </div>
      <div class="controls" aria-label="Dashboard controls">
        <div class="control">
          <label for="venueSelect">Venue</label>
          <select 
            id="venueSelect" 
            value={props.venueId} 
            onChange={(e) => props.onVenueChange(e.currentTarget.value)}
          >
            <option value="ny-nj">New York/New Jersey</option>
            <option value="toronto">Toronto</option>
            <option value="boston">Boston</option>
            <option value="philadelphia">Philadelphia</option>
            <option value="miami">Miami</option>
            <option value="dallas">Dallas</option>
            <option value="kansas">Kansas City</option>
            <option value="houston">Houston</option>
            <option value="atlanta">Atlanta</option>
            <option value="monterrey">Monterrey</option>
            <option value="mexico-city">Mexico City</option>
            <option value="vancouver">Vancouver</option>
            <option value="seattle">Seattle</option>
            <option value="sf-bay">San Francisco Bay Area</option>
            <option value="los-angeles">Los Angeles</option>
            <option value="guadalajara">Guadalajara</option>
          </select>
        </div>
        <div class="control">
          <label for="languageSelect">Language</label>
          <select 
            id="languageSelect" 
            value={props.language}
            onChange={(e) => props.onLanguageChange(e.currentTarget.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
            <option value="ja">Japanese</option>
          </select>
        </div>
      </div>
    </header>
  );
};
