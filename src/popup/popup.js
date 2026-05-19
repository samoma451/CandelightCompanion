const companion = document.getElementById("companion");

companion.addEventListener("click", () => {
  companion.classList.add("blink");

  setTimeout(() => {
    companion.classList.remove("blink");
  }, 800);
});