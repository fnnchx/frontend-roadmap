
let favoriteBooks = []; 

const localCatalog = [
    {
        key: '/works/local_1984',
        title: '1984',
        author_name: ['Джордж Оруэлл'],
        cover_i: null, 
        localCover: 'assests/1984.jpg', 
        isLocal: true
    },
    {
        key: '/works/local_tihiy_den',
        title: 'Тихий Дэн',
        author_name: ['Роман Мальцев'],
        cover_i: null,
        localCover: 'assests/boocover.webp', 
        isLocal: true
    }
];

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const booksContainer = document.getElementById('books-container');
const favoritesContainer = document.getElementById('favorites-container');
const statusMessage = document.getElementById('status-message');

const FAVORITES_KEY = 'bookCatalogFavorites';

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteBooks));
}

function loadFavorites() {
    const saved = localStorage.getItem(FAVORITES_KEY);
    if (saved) {
        favoriteBooks = JSON.parse(saved);
    }
}

async function searchBooks(query) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=12`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка сервера: ${response.status}`);
        }
        const data = await response.json();
        return data.docs; 
    } catch (error) {
        console.error('Ошибка поиска:', error);
        throw error; 
    }
}

function createBookCard(book, isFavoriteView = false) {

    const title = book.title || 'Название неизвестно';
    const author = book.author_name ? book.author_name.join(', ') : 'Автор неизвестен';
    const coverId = book.cover_i;
    const coverUrl = coverId 
        ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` 
        : 'https://via.placeholder.com/190x300?text=Нет+обложки'; 

    const isFavorite = favoriteBooks.some(fav => fav.key === book.key);

    const article = document.createElement('article');
    article.className = 'book-card';
    article.dataset.key = book.key; 

    article.innerHTML = `
        <button class="favorite" type="button" aria-label="${isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}">
            ${isFavorite ? '❤' : '♡'}
        </button>
        <h3 class="book-title">${title}</h3>
        <img height="300" width="190" src="${coverUrl}" alt="Обложка книги «${title}»" loading="lazy">
        <p><strong>Автор:</strong> ${author}</p>
    `;

    if (isFavoriteView) {
        const btn = article.querySelector('.favorite');
        btn.textContent = '❤';
        btn.setAttribute('aria-label', 'Убрать из избранного');
    }

    return article;
}

function renderBooks(books, container, isFavoriteView = false) {
    container.innerHTML = ''; 
    if (!books || books.length === 0) {
        if (!isFavoriteView) {
            container.innerHTML = '<p>По вашему запросу ничего не найдено.</p>';
        } else {
            container.innerHTML = '<p>В избранном пока ничего нет.</p>';
        }
        return;
    }

    const fragment = document.createDocumentFragment();
    books.forEach(book => {
        fragment.appendChild(createBookCard(book, isFavoriteView));
    });
    container.appendChild(fragment);
}

function renderFavorites() {
    renderBooks(favoriteBooks, favoritesContainer, true);
}

function toggleFavorite(bookKey, bookData) {
    const index = favoriteBooks.findIndex(fav => fav.key === bookKey);

    if (index === -1) {
        favoriteBooks.push(bookData);
    } else {
        favoriteBooks.splice(index, 1);
    }

    saveFavorites();
    renderFavorites(); 

    document.querySelectorAll(`.book-card[data-key="${bookKey}"] .favorite`).forEach(btn => {
        const isNowFavorite = favoriteBooks.some(fav => fav.key === bookKey);
        btn.textContent = isNowFavorite ? '❤' : '♡';
        btn.setAttribute('aria-label', isNowFavorite ? 'Убрать из избранного' : 'Добавить в избранное');
    });
}

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    const query = searchInput.value.trim();
    if (query.length < 2) {
        statusMessage.textContent = 'Введите хотя бы 2 символа для поиска.';
        return;
    }

    statusMessage.textContent = 'Поиск книг...';
    booksContainer.innerHTML = ''; 

    try {
        const books = await searchBooks(query);
        renderBooks(books, booksContainer);
        statusMessage.textContent = ''; 
    } catch (error) {
        statusMessage.textContent = 'Не удалось загрузить книги. Попробуйте ещё раз.';
        booksContainer.innerHTML = '';
    }
});

booksContainer.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.favorite');
    if (!favoriteBtn) return;

    const card = favoriteBtn.closest('.book-card');
    const bookKey = card.dataset.key;
  
    const title = card.querySelector('.book-title').textContent;
    const authorText = card.querySelector('p').textContent.replace('Автор: ', '');
    const imgSrc = card.querySelector('img').src;
    const coverIdMatch = imgSrc.match(/\/b\/id\/(\d+)-/);
    const cover_i = coverIdMatch ? parseInt(coverIdMatch[1]) : null;

    const bookData = {
        key: bookKey,
        title: title,
        author_name: [authorText],
        cover_i: cover_i
    };

    toggleFavorite(bookKey, bookData);
});

favoritesContainer.addEventListener('click', (e) => {
    const favoriteBtn = e.target.closest('.favorite');
    if (!favoriteBtn) return;

    const card = favoriteBtn.closest('.book-card');
    const bookKey = card.dataset.key;

    const bookData = favoriteBooks.find(fav => fav.key === bookKey);
    if (bookData) {
        toggleFavorite(bookKey, bookData);
    }
});


function init() {
    loadFavorites(); 
    renderFavorites(); 
}

document.addEventListener('DOMContentLoaded', init);