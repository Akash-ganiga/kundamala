document.addEventListener('DOMContentLoaded', function () {
  // Fetch suggested words and contact messages on page load
  fetchSuggestedWords();
  fetchContactMessages();

  // Populate Suggested Words Table
  function fetchSuggestedWords() {
    fetch("http://127.0.0.1:5000/admin/suggested_words")
      .then((response) => response.json())
      .then((data) => {
        const tableBody = document.getElementById("suggestedWordsTable").getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ""; // Clear the table

        data.forEach((wordData) => {
          const row = document.createElement("tr");

          // Add Word Column
          const wordCell = document.createElement("td");
          wordCell.textContent = wordData.word;
          row.appendChild(wordCell);

          // Add Meaning Column
          const meaningCell = document.createElement("td");
          meaningCell.textContent = wordData.meaning;
          row.appendChild(meaningCell);

          // Add User Column
          const userCell = document.createElement("td");
          userCell.textContent = wordData.user;
          row.appendChild(userCell);

          // Add Date Column
          const dateCell = document.createElement("td");
          dateCell.textContent = wordData.date;
          row.appendChild(dateCell);

          // Append the row to the table
          tableBody.appendChild(row);
        });
      })
      .catch((error) => {
        console.error("Error fetching suggested words:", error);
      });
  }

  // Populate Contact Messages Table
  function fetchContactMessages() {
    fetch("http://127.0.0.1:5000/admin/contact_submissions")
      .then(response => response.json())
      .then(data => {
        const contactsTable = document.getElementById('contactsTable').getElementsByTagName('tbody')[0];
        contactsTable.innerHTML = ''; // Clear the table before adding new rows
        data.forEach((entry) => {
          const row = contactsTable.insertRow();
          row.innerHTML = `
            <td>${entry.name}</td>
            <td>${entry.email}</td>
            <td>${entry.message}</td>
            <td>${entry.date}</td>
          `;
        });
      })
      .catch(error => console.error('Error fetching contact submissions:', error));
  }

  // Handle adding new word (not part of the existing backend but shown for reference)
  document.getElementById('addWordForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const newWord = document.getElementById('newWord').value;
    const newMeaning = document.getElementById('newMeaning').value;
    console.log('Adding new word:', newWord, newMeaning);
    alert('New word added!');
  });
});
