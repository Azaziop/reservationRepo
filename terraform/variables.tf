variable "network_name" {
  type    = string
  default = "reservation_dev_net"
}

variable "mysql_image" {
  type    = string
  default = "mysql:8.0"
}

variable "mysql_port" {
  type    = number
  default = 3306
}

variable "mysql_database" {
  type    = string
  default = "reservation_db"
}

variable "mysql_root_password" {
  type    = string
  default = ""
  description = "Root password for MySQL in dev (empty allowed for local dev)."
}
