import React from 'react'
import { Routes, Route } from 'react-router-dom'
import IntroPage from './pages/IntroPage'
import HubPage from './pages/HubPage'
import InterviewPage from './pages/InterviewPage'
import MapPage from './pages/MapPage'
import AboutPage from './pages/AboutPage'

export default function App() {
  return (
    <Routes>
      {/* Cinematic intro — the map site's animated terminal intro */}
      <Route path="/" element={<HubPage />} />

      {/* Hub — buttons for interactive info (from your diagram) */}
      <Route path="/hub" element={<HubPage />} />

      {/* AI interview flow: landing → dialogue → analyzing → BERT result */}
      <Route path="/interview" element={<InterviewPage />} />

      {/* World map with story markers + BERT panels */}
      <Route path="/map" element={<MapPage />} />

      {/* About us */}
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}
