// Select DOM Elements
const spinner = document.getElementById('spinner');
const sortSelect = document.getElementById('sort-select');
const movieGrid = document.getElementById('movie-grid');
const loadMoreBtn = document.getElementById('load-more');
const toggleDarkBtn = document.getElementById('toggle-dark');
const searchInput = document.getElementById('search-input');
const genreContainer = document.getElementById('genre-filters');
const suggestionsContainer = document.getElementById('search-suggestions');

// Initial Load and Theme
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
  }
  loadInitialMovies();
  fetchGenres();
});

// Dark Mode Toggle
toggleDarkBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// Spinner Control
function showSpinner() {
  spinner.classList.remove('hidden');
}
function hideSpinner() {
  spinner.classList.add('hidden');
}

// API Fetch Functions
async function fetchPopularMovies(page = 1) {
  const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to fetch popular movies:", err);
    return [];
  }
}

async function fetchMoviesByGenre(genreId) {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to fetch movies by genre:", err);
    return [];
  }
}

async function searchMovies(query) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to search movies:", err);
    return [];
  }
}

async function fetchGenres() {
  const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const data = await response.json();
    renderGenreButtons(data.genres);
  } catch (err) {
    console.error("Failed to fetch genres:", err);
    genreContainer.innerHTML = `<p style="color: gray;">Could not load genres.</p>`;
  }
}

// Movie Rendering
function renderMovies(movies) {
  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';

    let ratingClass;
    if (movie.vote_average >= 7.5) {
      ratingClass = 'high';
    } else if (movie.vote_average >= 6) {
      ratingClass = 'medium';
    } else {
      ratingClass = 'low';
    }

    movieCard.innerHTML = `
      <img src="${IMAGE_BASE + movie.poster_path}" alt="${movie.title}" />
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <span class="rating ${ratingClass}">${movie.vote_average.toFixed(2)}</span>
      </div>
    `;

    movieCard.addEventListener('click', () => {
      window.location.href = `movie.html?id=${movie.id}`;
    });

    movieGrid.appendChild(movieCard);
  });
}
// Render live suggestions
function renderSuggestions(movies) {
  suggestionsContainer.innerHTML = '';
  movies.slice(0, 5).forEach(movie => {
    const div = document.createElement('div');
    div.className = 'suggestion-item';
    div.textContent = movie.title;
    div.addEventListener('click', () => {
      searchInput.value = movie.title;
      suggestionsContainer.innerHTML = '';
      movieGrid.innerHTML = '';
      renderMovies([movie]);
      loadMoreBtn.style.display = 'none';
    });
    suggestionsContainer.appendChild(div);
  });
}

// Debounced live search
let debounceTimer;
searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();

  if (!query) {
    suggestionsContainer.innerHTML = '';
    if (!selectedGenreId) loadInitialMovies();
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    showSpinner();
    const results = await searchMovies(query);
    hideSpinner();
    renderSuggestions(results);
    renderMovies(results);
    loadMoreBtn.style.display = 'none';
  }, 300);
});
const searchingInput = document.getElementById("search-input");
const suggestionsBox = document.getElementById("search-suggestions");

searchingInput.addEventListener("input", () => {
  const query = searchingInput.value.trim();

  if (query.length > 0) {
    suggestionsBox.style.display = "block";  // show when typing
  } else {
    suggestionsBox.style.display = "none";   // hide if empty
  }
});

//  hide when clicking outside
document.addEventListener("click", (e) => {
  if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
    suggestionsBox.style.display = "none";
  }
});


// Genre Filter
let selectedGenreId = null;

function renderGenreButtons(genres) {
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.textContent = genre.name;
    btn.dataset.id = genre.id;

    btn.addEventListener('click', async () => {
      if (selectedGenreId === genre.id) {
        selectedGenreId = null;
        btn.classList.remove('selected');
        genreContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
        movieGrid.innerHTML = '';
        currentPage = 1;
        loadInitialMovies();
        loadMoreBtn.style.display = 'block';
        return;
      }

      selectedGenreId = genre.id;
      genreContainer.querySelectorAll('button').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');

      showSpinner();
      const movies = await fetchMoviesByGenre(selectedGenreId);
      hideSpinner();

      movieGrid.innerHTML = '';
      renderMovies(applyRatingSort(movies));
      loadMoreBtn.style.display = 'none';
    });

    genreContainer.appendChild(btn);
  });
}

// Search
searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();

    if (!query) {
      movieGrid.innerHTML = '';
      currentPage = 1;
      loadInitialMovies();
      return;
    }

    showSpinner();
    const searchResults = await searchMovies(query);
    hideSpinner();
    movieGrid.innerHTML = '';

    if (searchResults.length === 0) {
      movieGrid.innerHTML = `<p style="text-align:center; grid-column: 1 / -1; color: gray;">No movies found.</p>`;
      loadMoreBtn.style.display = 'none';
    } else {
      renderMovies(searchResults);
      loadMoreBtn.style.display = 'none';
    }
  }
});

// Sort by Rating
let currentPage = 1;

sortSelect.addEventListener('change', async () => {
  let movies = [];

  if (selectedGenreId) {
    movies = await fetchMoviesByGenre(selectedGenreId);
  } else if (searchInput.value.trim()) {
    movies = await searchMovies(searchInput.value.trim());
  } else {
    for (let i = 1; i <= currentPage; i++) {
      const pageMovies = await fetchPopularMovies(i);
      movies = movies.concat(pageMovies);
    }
  }

  movies = applyRatingSort(movies);
  movieGrid.innerHTML = '';
  renderMovies(movies);
});

function applyRatingSort(movies) {
  const value = sortSelect.value;
  if (value === 'desc') {
    return movies.sort((a, b) => b.vote_average - a.vote_average);
  } else if (value === 'asc') {
    return movies.sort((a, b) => a.vote_average - b.vote_average);
  }
  return movies;
}

// Initial Load + Pagination
async function loadInitialMovies() {
  currentPage = 1;
  showSpinner();
  const movies = await fetchPopularMovies(currentPage);
  hideSpinner();
  movieGrid.innerHTML = '';
  renderMovies(movies);

  if (!selectedGenreId && !searchInput.value.trim()) {
    loadMoreBtn.style.display = 'block';
    loadMoreBtn.style.alignContent = 'center';
    loadMoreBtn.style.justifyContent = 'center';
    loadMoreBtn.style.margin = '1rem auto';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

loadMoreBtn.addEventListener('click', async () => {
  try {
    currentPage++;
    showSpinner();
    const movies = await fetchPopularMovies(currentPage);
    hideSpinner();

    if (movies.length > 0) {
      renderMovies(movies);
    } else {
      loadMoreBtn.style.display = 'none';
      console.log("No more movies to load.");
    }
  } catch (err) {
    hideSpinner();
    console.error("Error loading more movies:", err);
  }
});
