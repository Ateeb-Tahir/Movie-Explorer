// ============================
// 🎯 Get Movie ID from URL
// ============================
const urlSearch = new URLSearchParams(window.location.search);
const movieId = urlSearch.get('id');

// ============================
//  Fetch and Display Movie Details
// ============================
async function fetchMovieDetails(id) {
  try {
    const response = await fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}`);

    // Check if the response is OK (status code 200–299)
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const movie = await response.json();

    const container = document.getElementById('movie-details');
    container.innerHTML = `
      <img src="${IMAGE_BASE + movie.poster_path}" alt="${movie.title}" />
      <div>
        <h2>${movie.title}</h2>
        <p><strong>Release Date:</strong> ${movie.release_date}</p>
        <p>${movie.overview}</p>
        <p><strong>Genres:</strong></p>
        <div class="genre-tags">
          ${movie.genres.map(g => `<span>${g.name}</span>`).join('')}
        </div>
        <p style="margin-top: 1rem;"><strong>Rating:</strong> ⭐ ${movie.vote_average} / 10</p>
      </div>
    `;
  } catch (err) {
    document.getElementById('movie-details').innerHTML = `
      <p style="color: red;">❌ Failed to load movie details. Please try again later.</p>
    `;
    console.error("Error fetching movie details:", err);
  }
}
fetchMovieDetails(movieId);// Fetch movie details when the page loads

// ============================
// Apply Theme on Page Load
// ============================
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
});

// ============================
// Toggle Dark Mode (Details Page)
// ============================
const toggleDarkBtn = document.getElementById('toggle-dark');

if (toggleDarkBtn) {
  toggleDarkBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}
