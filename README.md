---

# VIS-SKINS

This API allows you to retrieve and render Minecraft player skins. You can request either the full body or the head render of a player's skin, and optionally specify the scale of the rendered image.

## Base URL

```
https://skins-vis.galnod.com
```

## Endpoints

### Get Skin Render

#### URL

```
GET /2d/skin/:name/:type
```

- `:name`: Minecraft player name.
- `:type`: Type of render. Can be either `head` or `fullbody`.

#### Query Parameters

- `scale`: (Optional) Scale of the rendered image. Default is 25.

#### Example Usage

- Get the head render of the player skin:
  ```
  GET /2d/skin/Crujera27_3/head
  ```

- Get the full body render of the player skin with scale 2:
  ```
  GET /2d/skin/Crujera27_3/fullbody?scale=2
  ```

## Response

The API responds with the rendered image of the player's skin in PNG format.

## Error Handling

If an error occurs during the request processing, the API responds with an appropriate HTTP status code along with an error message.

---
