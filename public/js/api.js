const API = {
  async getBooks() {
    const response = await fetch('/api/books');

    if (!response.ok) {
      throw new Error(`Failed to load books: ${response.status}`);
    }

    return response.json();
  }
};