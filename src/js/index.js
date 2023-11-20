import '../css/style.css';
import { PixabayAPI } from '../js/api';
import createPhotoCard from '../templates/card-template.hbs';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const formSearch = document.querySelector('.search-form');
const infiniteScrollContainer = document.querySelector('.scroll-container');

const pixabayApi = new PixabayAPI();

let gallery = new SimpleLightbox('.gallery a');

let isLoading = false;
let hasError = false;

const handleSearchFoto = async ev => {
  ev.preventDefault();
  infiniteScrollContainer.innerHTML = '';
  pixabayApi.page = 1;
  hasError = false;

  const searchItem = ev.target.elements['searchQuery'].value.trim();

  pixabayApi.q = searchItem;

  if (!searchItem) {
    Notiflix.Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
    return;
  }

  searchGallery();
};

async function searchGallery() {
  try {
    const { data } = await pixabayApi.fetchPhoto();

    if (data.totalHits === 0) {
      Notiflix.Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }
    
    infiniteScrollContainer.innerHTML = createPhotoCard(data.hits);

    Notiflix.Notify.success(`Hooray! We found ${data.totalHits} images.`);

    gallery.refresh();

    const maxPhotosPerPage = 40;
    if (data.totalHits > maxPhotosPerPage) {
      loadMoreImages();
      window.addEventListener('scroll', loadMoreImages); 
    }
  } catch (error) {
    console.log(error);
    hasError = true; 
  }
}

function loadMoreImages() {

  if (isLoading) {
    return;
  }

  if (isLoading || hasError) {
    return;
  }

  const containerHeight = infiniteScrollContainer.offsetHeight;
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;

  if (containerHeight - (scrollTop + windowHeight) < 200) {
    isLoading = true; 
    pixabayApi.page += 1;
    searchMorePhoto().then(() => {
      isLoading = false;
    });
  }
}

async function searchMorePhoto() {
  try {
    const { data } = await pixabayApi.fetchPhoto();

    infiniteScrollContainer.insertAdjacentHTML('beforeend', createPhotoCard(data.hits));
    
    gallery.refresh();

    if (data.hits.length < pixabayApi.per_page) {
      window.removeEventListener('scroll', loadMoreImages);
      Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
    }
  } catch (error) {
    console.log(error);
    hasError = true;
    Notiflix.Notify.info("We're sorry, but you've reached the end of search results.");
  } finally {
    isLoading = false;
  }
}

formSearch.addEventListener('submit', handleSearchFoto);
