#!/bin/bash

# Function to start Docker Compose
start() {
    docker-compose up -d
}

# Function to restart Docker Compose
restart() {
    docker-compose down
    docker-compose up -d
}

# Function to stop Docker Compose
stop() {
    docker-compose down
}

# Function to print colorful text
print_colorful() {
    echo -e "\e[$2m$1\e[0m"  # Specify color code as the second argument
}

# Function to print a larger font
print_large_font() {
    echo -e "\e[1m$1\e[0m"  # Bold text
}

# Function to print a colorful banner
print_banner() {
    echo -e "\e[1;34m
██╗  ██╗███████╗██╗     ██╗      ██████╗         ██╗  ██╗███████╗██╗  ██╗
██║  ██║██╔════╝██║     ██║     ██╔═══██╗        ██║  ██║██╔════╝╚██╗██╔╝
███████║█████╗  ██║     ██║     ██║   ██║        ███████║█████╗   ╚███╔╝ 
██╔══██║██╔══╝  ██║     ██║     ██║   ██║        ██╔══██║██╔══╝   ██╔██╗ 
██║  ██║███████╗███████╗███████╗╚██████╔╝███████╗██║  ██║███████╗██╔╝ ██╗
╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
\e[0m"
}

# Display colorful banner
print_banner

# Menu
print_large_font "Select an option:"

print_colorful "1. Start" 32  # Green color
print_colorful "2. Restart" 33  # Yellow color
print_colorful "3. Stop" 31  # Red color
print_colorful "4. Exit" 36  # Cyan color

# Read user input
read -p "Enter the number of your choice: " choice

# Execute corresponding action based on user input
case "$choice" in
    1)
        start
        ;;
    2)
        restart
        ;;
    3)
        stop
        ;;
    4)
        print_colorful "Exiting..." 35  # Purple color
        exit 0
        ;;
    *)
        print_colorful "Invalid choice. Exiting..." 31  # Red color
        exit 1
        ;;
esac

exit 0
