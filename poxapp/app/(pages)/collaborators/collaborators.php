<?php

    session_start();
    $id = isset($_SESSION['id']);
    $username = isset($_SESSION['username']);

    if(!$username){ header('location:index.html'); }

?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>

    <?php include "include/userDynamicImports.php" ?>
</head>
<body>

    <?php include "components/header.php" ?>
    <?php include "components/menu.php" ?>

    <style>

        .collaborators-container{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            grid-gap: 20px;
        }

        .collaborator-element-container{
            display: grid;
            box-shadow: 0px 0px 0.5px var(--light-gray);
            border-radius: 10px;
            overflow: hidden;
            aspect-ratio: 1/1;
            position: relative;
            cursor: pointer;
            transition: 0.3s all;
        }.collaborator-element-container:hover{
            transform: scale(0.97);
        }

        .collaborator-element-container img{
            width: 100%;
            min-height: 100%;
            background-size: cover;
        }

        /* .collaborator-element-container:hover > .prediction-descriptions{
            bottom: 0%;
        } */

        .collaborator-details {
            /* From https://css.glass */
            background: rgba(46, 35, 73, 0.6);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(9.5px);
            -webkit-backdrop-filter: blur(9.5px);
            border: 1px solid rgba(255, 255, 255, 0.3);

            padding: 26px;
            position: absolute;
            /* height: 30%; */
            max-height: 100%;
            width: 100%;
            left: 0px;
            bottom: 0%;
            z-index: 1;
            transition: 0.3s all;
            color: white;
        }

    </style>

    <div class="main-container normal-margin">

        <div class="collaborators-container"></div>
        

    </div>


    <script>

    function renderCollaboratorContainer(data){

        const collaboratorElementContainer = document.createElement("div");
        collaboratorElementContainer.className = "collaborator-element-container";

        const innerImage = document.createElement("img");
        innerImage.src = "collaborators/" + data.imageName;

        const collabratorDetails = document.createElement("div");
        collabratorDetails.className = "collaborator-details";

        const collabratorName = document.createElement("div");
        collabratorName.className = "decription-name";
        collabratorName.textContent = data.name;

        collabratorDetails.append(collabratorName)

        collaboratorElementContainer.append(innerImage);
        collaboratorElementContainer.append(collabratorDetails);

        collaboratorElementContainer.addEventListener("click", () => {})

        return collaboratorElementContainer;

        }

        const collaborators = [
            {
                name: "Prof. Dr. Tamer Şanlıdağ",
                imageName: 'tamer.jpg'
            },
            {
                name: "Prof. Dr. Fadi Al-Turjman",
                imageName: 'fadi.png'
            },
            {
                name: "Mr. Ibrahim Ame",
                imageName: 'ibrahim.png'
            },
        ]


        const collaboratorContainer = document.querySelector(".collaborators-container");

        collaborators.forEach( collaborator => {
            const element = renderCollaboratorContainer(collaborator);
            collaboratorContainer.append(element);
        })


    </script>
</body>
</html>