# Pattern Rules

1. p tagName is textarea || .description || .desc
   and the value is .content if typeof content === "string"
   have property like {.description : content: "some text content"}
2. h\* tagName is text || .title
   and the value is .content if typeof content === "string"
3. the .content is an Array, and has item like
   {title: "some title" // type=text, description: "some description" // type=textarea}
4. the fallback if the inner .content typeof content === "string"
   make it type=text
5. property image, src is type=file
