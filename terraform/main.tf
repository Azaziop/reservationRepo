terraform {
  required_version = ">= 1.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = ">= 3.0.0"
    }
  }
}

provider "docker" {
  # Default: use local Docker engine (unix socket or Docker Desktop)
}

resource "docker_network" "reservation_net" {
  name = var.network_name
}

resource "docker_volume" "mysql_data" {
  name = "reservation_mysql_data"
}

resource "docker_image" "mysql" {
  name = var.mysql_image
  keep_locally = true
}

resource "docker_container" "mysql" {
  name  = "reservation-mysql-tf"
  image = docker_image.mysql.name

  ports {
    internal = 3306
    external = var.mysql_port
  }

  env = [
    "MYSQL_DATABASE=${var.mysql_database}",
    "MYSQL_ROOT_PASSWORD=${var.mysql_root_password}"
  ]

  volumes {
    container_path = "/var/lib/mysql"
    volume_name    = docker_volume.mysql_data.name
  }

  networks_advanced {
    name = docker_network.reservation_net.name
  }

  restart = "unless-stopped"
}
