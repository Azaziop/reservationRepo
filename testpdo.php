<?php
try {
    new PDO("mysql:host=127.0.0.1;port=32771", "root", "");
    echo "OK";
} catch (Exception $e) {
    echo "ERR:" . $e->getMessage();
    exit(1);
}
?>
