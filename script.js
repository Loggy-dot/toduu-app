
document.addEventListener("DOMContentLoaded", () => {

  const currentPath = window.location.pathname
  const navLinks = document.querySelectorAll(".nav-links a")

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")
    if (currentPath.includes(linkPath) && linkPath !== "/") {
      link.classList.add("active")
    } else if (currentPath === "/" && linkPath === "/") {
      link.classList.add("active")
    }
  })
})
