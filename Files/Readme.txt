===========================
  CRM SYSTEM - README FILE
===========================

Welcome to the CRM (Customer Relationship Management) System!

Project Title: CRM System
Author: W.A.K. Tharushi Nimeshika
Date: 11/15/2025

1. Introduction

This CRM (Customer Relationship Management) System is developed to help businesses manage 
their customer interactions, sales processes, and service delivery more efficiently.
The system allows users to store customer data, track communication history, manage leads,
and opportunities, and generate reports to improve customer engagement and business performance.

Designed with a user-friendly interface, this CRM system is ideal for small to medium-sized
businesses seeking a simple and effective solution to organize customer-related operations 
in one centralized platform.


2. How to Use the System 

    Login:
        - Open login.html in a browser.
        - Enter your registered email and password.
        - Click "Sign in" to access the dashboard.

    Register:
        - On the login screen, click “Sign up”.
        - Fill in the required fields and submit.
        - Then log in using those credentials.

    Dashboard Includes:
        - Dashboard: View overview and stats
        - Billing
        - Inventory
        - Customers
        - GRN
        - Quotations
        - Payments
        - Credit Bills
        - Cheques
        - Reports
        - Settings


    - Billing Page (5-Step Process)

      1. Customer Details
         - Customer Type
         - Name
         - Address
         - Phone Number

      2. Distribution Channel
         - Dropdown for selecting the channel

      3. Add Items
         - Scan barcode or enter item code
         - Item name
         - Quantity

      4. Shopping Cart
         - Table showing items: product name, quantity, unit price, total
         - Price calculations:
           - Subtotal, discount (if any), grand total

      5. Payment Method
         - Select payment type: Cash, Card, etc.
         - Confirm payment


    - Inventory Management

      1. Add New Item
         - Item Code / Barcode
         - Item Name
         - Description (optional)
         - Unit Price (LKR)
         - Initial Stock Quantity
         - Threshold (minimum stock alert)
         - Save Item Button

      2. Current Inventory
         - Displays all inventory items in a popup window
         - Shows:
           - Item Code, Name, Price, Stock, Threshold, Actions


    - Customers Page

      1. Add New Customer
         - Customer ID (Auto-generated)
         - Customer Name
         - Address
         - Telephone Number
         - Credit Limit (LKR)
         - Add Customer Button

      2. Registered Customers
         - Displays all stored customer data in a popup window
           - ID, Name, Address, Telephone, Credit Limit, Actions


    - GRN Page

      1. Add New GRN
         - Supplier Name
         - GRN Date
         - Items Received

      2. GRN History
         - Displays all GRN records in a popup window:
           - GRN ID, Date, Supplier, Items, Actions


    - Quotations

      1. Create New Quotation
         - Customer Name
         - Quotation Date
         - Items for Quotation
         - Add Item
         - Generate Quotation

      2. Quotation History
         - Displays all quotation records in a popup window:
           - Quotation ID, Date, Customer, Items, Total, Actions


    - Payment Records

      1. Search Payment Records
         - Start date
         - End date
         - Filter Payments

      2. View All Payments
         - Payment ID, Date, Bill ID, Amount (LKR), Method, Reference, Actions


    - Credit Bills Management

      1. Filter Credit Bills
         - Start date
         - End date

      2. View All Credit Bills
         - Bill ID, Customer, Bill Date, Total (LKR), Paid (LKR), Due (LKR), Due Date, Status, Actions


    - Cheques Tracking

      1. Filter Cheques
         - Start date
         - End date

      2. View All Cheques
         - Cheque ID, Bill ID, Number, Bank, Amount (LKR), Due Date, Status, Actions


    - Reports

      1. Generate Reports
         - Start date
         - End date

      2. View and Download Reports


    - Settings

      1. Shop Settings and Customization
         - Shop Details
         - Add Dashboard Logo
         - Add Receipt Logo
         - Distribution Channels

      2. Existing Channels
         - View existing channels in a popup window


3. File Structure

        - CodeOverview: For developers
        - index.html: Main dashboard interface  
        - login.html: Login and registration page 
        - login.js: Login functionality 
        - Readme.txt: This file
        - script.js: JavaScript functionality of the dashboard  
        - style.css: Styling for the project  


4. Notes
        - Use a modern browser to run the system.
        - Ensure JavaScript is enabled.
        - All data is stored in localStorage.
        - Use developer tools (F12) for debugging if needed.


