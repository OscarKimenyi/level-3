import React from "react";

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-3 mt-auto">
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-6">
            <p className="mb-0">
              <i className="bi bi-mortarboard-fill me-2"></i>
              Student Management System © {new Date().getFullYear()}
            </p>
          </div>
          <div className="col-md-6 text-end">
            <p className="mb-0">
              Developed with <i className="bi bi-heart-fill text-danger"></i>{" "}
              for Education
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
