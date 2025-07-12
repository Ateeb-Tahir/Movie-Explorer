// ============================
// 🔧 Select DOM Elements
// ============================
const spinner = document.getElementById('spinner');
const sortSelect = document.getElementById('sort-select');
const movieGrid = document.getElementById('movie-grid');
const loadMoreBtn = document.getElementById('load-more');
const toggleDarkBtn = document.getElementById('toggle-dark');
const searchInput = document.getElementById('search-input');
const genreContainer = document.getElementById('genre-filters');




// ============================
// 🌗 Theme Handling (Dark Mode)
// ============================
window.addEventListener('DOMContentLoaded', () => {//it is important to ensure the DOM is fully loaded before accessing elements
  const savedTheme = localStorage.getItem('theme');// 'theme' is a key in localStorage that stores the user's theme preference
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');// if the saved theme is 'dark', add the 'dark' class to the body
  }
  loadInitialMovies();
  fetchGenres();
});

toggleDarkBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');// toggle adds if removed and removes if added
  const isDark = document.body.classList.contains('dark');// contains() checks if the 'dark' class is present on the body
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ============================
// ⏳ Spinner Control
// ============================
function showSpinner() {
  spinner.classList.remove('hidden');// remove the 'hidden' class to show the spinner
}
function hideSpinner() {
  spinner.classList.add('hidden');// add the 'hidden' class to hide the spinner
}

// ============================
// 🌐 API Fetch Functions
// ============================
async function fetchPopularMovies(page = 1) {// takes an optional page number, defaulting to 1
  const url = `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to fetch popular movies:", err);
    return [];
  }
}

async function fetchMoviesByGenre(genreId) {// takes a genre ID and fetches movies of that genre
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`;// Construct the URL to fetch movies by genre
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to fetch movies by genre:", err);
    return [];
  }
}

async function searchMovies(query) {// takes a search query and fetches movies matching that query
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;// encodeURIComponent ensures the query is properly formatted for a URL
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    return data.results;
  } catch (err) {
    console.error("Failed to search movies:", err);
    return [];
  }
}


async function fetchGenres() {// Fetches the list of movie genres from the API instead of hardcoding them
  const url = `${BASE_URL}/genre/movie/list?api_key=${API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }
    const data = await response.json();
    renderGenreButtons(data.genres);
  } catch (err) {//while network failure or API error, display a message
    console.error("Failed to fetch genres:", err);//for developer
    genreContainer.innerHTML = `<p style="color: gray;">Could not load genres.</p>`;// for user
  }
}


// ============================
// 🎞️ Movie Rendering
// ============================
function renderMovies(movies) {
  movies.forEach(movie => {
    const movieCard = document.createElement('div');//<div> as a blank box
    movieCard.className = 'movie-card';// add a class for styling

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
      window.location.href = `movie.html?id=${movie.id}`;// Redirect to the movie details page with the movie ID in the URL
    });

    movieGrid.appendChild(movieCard);//o make it visible, we must append it to the movie grid which is responsible for iamge display
  });
}

// ============================
// 🏷️ Genre Filter
// ============================
let selectedGenreId = null;

function renderGenreButtons(genres) {
  genres.forEach(genre => {
    const btn = document.createElement('button');
    btn.textContent = genre.name;// Set the button text to the genre name
    btn.dataset.id = genre.id;//datata set attribute to store the genre ID

    btn.addEventListener('click', async () => {// when a genre button is clicked, fetch and display movies of that genre
      if (selectedGenreId === genre.id) {// If the clicked genre is already selected, reset the filter
        selectedGenreId = null;
        btn.classList.remove('selected');// Remove the 'selected' class from the button

        genreContainer.querySelectorAll('button').forEach(b =>  b.classList.remove('selected'));//It makes sure only one genre button is highlighted (selected) at a time by clearing the previous selection before adding the new one.

        movieGrid.innerHTML = '';// Clear the movie grid
        currentPage = 1;//
        loadInitialMovies();
        loadMoreBtn.style.display = 'block';
        return;
      }

      selectedGenreId = genre.id;// Set the selected genre ID to the clicked genre's ID
      genreContainer.querySelectorAll('button').forEach(b =>
         b.classList.remove('selected'));// Remove the 'selected' class from all genre buttons

      btn.classList.add('selected');// Add the 'selected' class to the clicked button

      
      showSpinner();// Show the spinner while fetching movies
      const movies = await fetchMoviesByGenre(selectedGenreId);
      hideSpinner();// Hide the spinner after fetching movies
      
      movieGrid.innerHTML = '';
      renderMovies(applyRatingSort(movies));
      loadMoreBtn.style.display = 'none';// Hide the "Load More" button since we are displaying genre-specific movies
    });

    genreContainer.appendChild(btn);// Append the button to the genre container
  });
}

// ============================
// 🔍 Search Functionality
// ============================

searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = e.target.value.trim();

    if (!query) {
      movieGrid.innerHTML = '';
      currentPage = 1;
      loadInitialMovies();//
      return;
    }

    showSpinner();// Show the spinner while fetching search results
    const searchResults = await searchMovies(query);// Fetch movies based on the search query
    hideSpinner();
    movieGrid.innerHTML = '';//movie grid is empty because we are going to display new search results

    if (searchResults.length === 0) {
      movieGrid.innerHTML = `<p style="text-align:center; grid-column: 1 / -1; color: gray;">No movies found.</p>`;
      loadMoreBtn.style.display = 'none';// Hide the "Load More" button since there are no results to load more of
    } else {
      renderMovies(searchResults);
      loadMoreBtn.style.display = 'none';
    }
  }
});

// ============================
// 📊 Sort by Rating
// ============================
let currentPage = 1;//current pages gets updated when the user clicks the "Load More" button
sortSelect.addEventListener('change', async () => {// When the sort option changes, fetch and display movies accordingly
  const value = sortSelect.value;//
  let movies = [];

  if (selectedGenreId) {// If a genre is selected, fetch movies by that genre
    movies = await fetchMoviesByGenre(selectedGenreId);
  } else if (searchInput.value.trim()) {
    movies = await searchMovies(searchInput.value.trim());
  } else {// If no genre or search query is selected, fetch popular movies
      for (let i = 1; i <= currentPage; i++) {
        const pageMovies = await fetchPopularMovies(i);
        movies = movies.concat(pageMovies);// Concatenate movies from all pages up to the current page
      }
  }
  movies = applyRatingSort(movies);// Sort the movies based on the selected rating order

  movieGrid.innerHTML = '';// Clear the movie grid before rendering sorted movies
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

// ============================
// 🔄 Load Initial + Pagination
// ============================
async function loadInitialMovies() {
  showSpinner();
  const movies = await fetchPopularMovies();
  hideSpinner();
  movieGrid.innerHTML = '';
  renderMovies(movies);
}

loadMoreBtn.addEventListener('click', async () => {
  currentPage++;
  showSpinner();
  const movies = await fetchPopularMovies(currentPage);
  hideSpinner();
  renderMovies(movies);
});
