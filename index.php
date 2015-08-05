<?php 
header('Location: index.html');
$name = $_POST['name'];
$email = $_POST['email'];
$message = "Name: " . $name . "\r\n" . "Reply-To:" . $email . "\r\n" .$_POST['msgtext'];

$headers = "From: pob@pobv.me" . "\r\n";

$to = "Vutisat@miamioh.edu";
$subject = "New message from the website!";

$a = mail( $to, $subject, $message, $headers );
if ($a) {
   echo("Message was sent sucessfully! I look forward to reading it!");
   exit;
}else {
   echo("Message wasn't sent, please check that you have changed emails in the bottom");
    exit;
}